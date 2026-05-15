import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { DriverStatus, OrderOfferStatus, OrderStatus, Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { JwtUser } from '../auth/auth.types';
import { PricingService } from '../pricing/pricing.service';
import { PushService } from '../push/push.service';
import { SocketEvent, Rooms } from '../sockets/socket-events';
import {
  MATCHING_DEFAULT_RADIUS_KM,
  MATCHING_MAX_CANDIDATES_PER_RADIUS,
  MATCHING_MAX_RADIUS_KM,
  MATCHING_OFFER_TIMEOUT_SECONDS,
  MATCHING_RADIUS_STEP_KM,
} from './matching.constants';
import { DriverCandidate, MatchingServer, OrderOfferPayload } from './matching.types';

const ACTIVE_ORDER_STATUSES = [
  OrderStatus.DRIVER_ASSIGNED,
  OrderStatus.DRIVER_ARRIVED,
  OrderStatus.IN_PROGRESS,
];

const GEO_DRIVERS_KEY = 'geo:drivers:online';
const OFFER_EXPIRY_PREFIX = 'offer:expiry:';

type OrderWithMatchingData = Prisma.OrderGetPayload<{
  include: { tariff: true; passenger: true };
}>;

@Injectable()
export class MatchingService implements OnModuleInit {
  private readonly logger = new Logger(MatchingService.name);
  private server?: MatchingServer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly pushService: PushService,
    private readonly pricingService: PricingService,
  ) {}

  // Баг 9: при старте восстанавливаем таймеры из БД — работает при любом кол-ве реплик
  async onModuleInit() {
    const pendingOffers = await this.prisma.orderOffer.findMany({
      where: { status: OrderOfferStatus.PENDING, expiresAt: { gt: new Date() } },
      select: { id: true, expiresAt: true },
    });
    for (const offer of pendingOffers) {
      this.scheduleOfferExpiry(offer.id, offer.expiresAt);
    }
    this.logger.log(`Restored ${pendingOffers.length} pending offer timers`);
  }


  setServer(server: MatchingServer) {
    this.server = server;
  }

  async startMatching(orderId: string) {
    const order = await this.getSearchableOrder(orderId);
    this.emitMatchingStarted(order);
    return this.continueMatching(orderId);
  }

  async continueMatching(orderId: string) {
    const order = await this.getSearchableOrder(orderId);
    const candidate = await this.findNearestCandidate(order);

    if (!candidate) {
      this.emitNoDrivers(order);
      return null;
    }

    const offer = await this.createOffer(order, candidate);
    this.emitOfferNew(order, offer.id, candidate.driverId, candidate.distanceKm, offer.expiresAt);
    this.scheduleOfferExpiry(offer.id, offer.expiresAt);
    void this.pushService.notifyDrivers([candidate.driverId], {
      type: 'NEW_ORDER',
      orderId: order.id,
      role: 'DRIVER',
    });
    return offer;
  }

  async findNearestCandidate(order: OrderWithMatchingData): Promise<DriverCandidate | null> {
    for (
      let radiusKm = MATCHING_DEFAULT_RADIUS_KM;
      radiusKm <= MATCHING_MAX_RADIUS_KM;
      radiusKm += MATCHING_RADIUS_STEP_KM
    ) {
      const candidates = await this.findCandidatesInRadius(order, radiusKm);
      if (candidates.length) {
        return candidates[0];
      }
    }

    return null;
  }

  async getCurrentOffer(user: JwtUser) {
    const driver = await this.getDriverForUser(user);
    return this.prisma.orderOffer.findFirst({
      where: { driverId: driver.id, status: OrderOfferStatus.PENDING, expiresAt: { gt: new Date() } },
      include: { order: { include: { tariff: true } } },
      orderBy: { offeredAt: 'desc' },
    });
  }

  async getAvailableOffers(user: JwtUser) {
    const offer = await this.getCurrentOffer(user);
    return offer ? [this.toAvailableOffer(offer)] : [];
  }

  async acceptOffer(user: JwtUser, offerId: string) {
    const driver = await this.getDriverForUser(user);
    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      const offer = await tx.orderOffer.findUnique({
        where: { id: offerId },
        include: { order: true, driver: true },
      });

      if (!offer) {
        throw new NotFoundException('Offer not found');
      }
      if (offer.driverId !== driver.id) {
        throw new ForbiddenException('Offer belongs to another driver');
      }
      if (offer.status !== OrderOfferStatus.PENDING) {
        throw new ConflictException('Offer is not pending');
      }
      if (offer.expiresAt <= now) {
        throw new ConflictException('Offer expired');
      }
      if (offer.order.status !== OrderStatus.SEARCHING || offer.order.driverId) {
        throw new ConflictException('Order is no longer available');
      }
      if (offer.driver.status !== DriverStatus.ONLINE) {
        throw new ConflictException('Driver is not available');
      }

      await tx.orderOffer.update({
        where: { id: offer.id },
        data: { status: OrderOfferStatus.ACCEPTED, respondedAt: now },
      });
      await tx.orderOffer.updateMany({
        where: { orderId: offer.orderId, status: OrderOfferStatus.PENDING, id: { not: offer.id } },
        data: { status: OrderOfferStatus.CANCELED, respondedAt: now },
      });
      await tx.driver.update({
        where: { id: driver.id },
        data: { status: DriverStatus.BUSY },
      });
      await tx.orderHistory.create({
        data: {
          orderId: offer.orderId,
          status: OrderStatus.DRIVER_ASSIGNED,
          comment: `Accepted by driver ${driver.id}.`,
        },
      });

      return tx.order.update({
        where: { id: offer.orderId },
        data: {
          driverId: driver.id,
          status: OrderStatus.DRIVER_ASSIGNED,
          assignedAt: now,
          acceptedAt: now,
        },
        include: this.orderInclude(),
      });
    });

    this.clearOfferTimer(offerId);
    this.server?.to(Rooms.driver(driver.id)).emit(SocketEvent.OrderOfferAccepted, { offerId, orderId: result.id });
    this.server?.to([Rooms.order(result.id), Rooms.passenger(result.passengerId)]).emit(SocketEvent.OrderAccepted, result);
    this.server?.to(Rooms.admins).emit(SocketEvent.OrderAccepted, result);
    void this.pushService.notifyPassenger(result.passengerId, {
      type: 'ORDER_ACCEPTED',
      orderId: result.id,
      role: 'PASSENGER',
    });
    return result;
  }

  async acceptOrder(user: JwtUser, orderId: string) {
    const driver = await this.getDriverForUser(user);
    const offer = await this.prisma.orderOffer.findFirst({
      where: { orderId, driverId: driver.id, status: OrderOfferStatus.PENDING },
      orderBy: { offeredAt: 'desc' },
    });

    if (!offer) {
      throw new ForbiddenException('Driver has no pending offer for this order');
    }

    return this.acceptOffer(user, offer.id);
  }

  async rejectOffer(user: JwtUser, offerId: string) {
    const driver = await this.getDriverForUser(user);
    const offer = await this.prisma.orderOffer.findUnique({ where: { id: offerId } });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    if (offer.driverId !== driver.id) {
      throw new ForbiddenException('Offer belongs to another driver');
    }
    if (offer.status !== OrderOfferStatus.PENDING) {
      throw new ConflictException('Offer is not pending');
    }

    const updated = await this.prisma.orderOffer.update({
      where: { id: offer.id },
      data: { status: OrderOfferStatus.REJECTED, respondedAt: new Date() },
    });

    this.clearOfferTimer(offer.id);
    this.server?.to(Rooms.driver(driver.id)).emit(SocketEvent.OrderOfferRejected, {
      offerId: offer.id,
      orderId: offer.orderId,
    });
    void this.continueMatching(offer.orderId);
    return updated;
  }

  async expireOffer(offerId: string) {
    const offer = await this.prisma.orderOffer.findUnique({ where: { id: offerId } });
    if (!offer || offer.status !== OrderOfferStatus.PENDING || offer.expiresAt > new Date()) {
      return null;
    }

    const updated = await this.prisma.orderOffer.update({
      where: { id: offer.id },
      data: { status: OrderOfferStatus.EXPIRED, respondedAt: new Date() },
    });

    this.clearOfferTimer(offer.id);
    this.server?.to(Rooms.driver(offer.driverId)).emit(SocketEvent.OrderOfferExpired, {
      offerId: offer.id,
      orderId: offer.orderId,
    });
    void this.continueMatching(offer.orderId);
    return updated;
  }

  async cancelOffers(orderId: string, reason: 'ORDER_CANCELED' | 'ACCEPTED_BY_OTHER_DRIVER' = 'ORDER_CANCELED') {
    const offers = await this.prisma.orderOffer.findMany({
      where: { orderId, status: OrderOfferStatus.PENDING },
      select: { id: true, driverId: true },
    });

    await this.prisma.orderOffer.updateMany({
      where: { orderId, status: OrderOfferStatus.PENDING },
      data: { status: OrderOfferStatus.CANCELED, respondedAt: new Date() },
    });

    for (const offer of offers) {
      this.clearOfferTimer(offer.id);
      this.server?.to(Rooms.driver(offer.driverId)).emit(SocketEvent.OrderOfferCanceled, {
        offerId: offer.id,
        orderId,
        reason,
      });
    }
  }

  private async getSearchableOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { tariff: true, passenger: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OrderStatus.SEARCHING || order.driverId) {
      throw new ConflictException('Order is not searchable');
    }
    return order;
  }

  private async findCandidatesInRadius(order: OrderWithMatchingData, radiusKm: number) {
    // Баг 3: используем Redis GEOSEARCH вместо полного скана PostgreSQL
    const raw = await this.redis.client.geosearch(
      GEO_DRIVERS_KEY,
      'FROMLONLAT',
      Number(order.pickupLng),
      Number(order.pickupLat),
      'BYRADIUS',
      radiusKm,
      'km',
      'ASC',
      'COUNT',
      MATCHING_MAX_CANDIDATES_PER_RADIUS * 3, // берём с запасом, отфильтруем ниже
      'WITHDIST',
    ) as [string, string][];

    if (!raw.length) {
      return [];
    }

    const driverIds = raw.map(([id]) => id);

    // Валидируем только найденных кандидатов — не всю таблицу
    const validDrivers = await this.prisma.driver.findMany({
      where: {
        id: { in: driverIds },
        status: DriverStatus.ONLINE,
        user: { status: UserStatus.ACTIVE },
        offers: { none: { orderId: order.id } },
        orders: { none: { status: { in: ACTIVE_ORDER_STATUSES } } },
      },
      select: { id: true },
    });

    const validIds = new Set(validDrivers.map((d) => d.id));

    return raw
      .filter(([id]) => validIds.has(id))
      .map(([id, dist]) => ({ driverId: id, distanceKm: Number(dist) }))
      .slice(0, MATCHING_MAX_CANDIDATES_PER_RADIUS);
  }

  private async createOffer(order: OrderWithMatchingData, candidate: DriverCandidate) {
    const expiresAt = new Date(Date.now() + MATCHING_OFFER_TIMEOUT_SECONDS * 1000);
    return this.prisma.orderOffer.create({
      data: {
        orderId: order.id,
        driverId: candidate.driverId,
        expiresAt,
      },
    });
  }

  private emitMatchingStarted(order: OrderWithMatchingData) {
    this.server?.to([Rooms.order(order.id), Rooms.passenger(order.passengerId)]).emit(SocketEvent.OrderMatchingStarted, {
      orderId: order.id,
      status: OrderStatus.SEARCHING,
    });
  }

  private emitNoDrivers(order: OrderWithMatchingData) {
    const payload = { orderId: order.id, message: 'Поблизости нет свободных водителей' };
    this.server?.to([Rooms.order(order.id), Rooms.passenger(order.passengerId)]).emit(SocketEvent.OrderNoDriversAvailable, payload);
    this.server?.to(Rooms.admins).emit(SocketEvent.OrderNoDriversAvailable, payload);
  }

  private emitOfferNew(
    order: OrderWithMatchingData,
    offerId: string,
    driverId: string,
    distanceToPickupKm: number,
    expiresAt: Date,
  ) {
    const payload: OrderOfferPayload = {
      offerId,
      orderId: order.id,
      pickupAddress: order.pickupAddress,
      pickupLat: Number(order.pickupLat),
      pickupLng: Number(order.pickupLng),
      destinationAddress: order.dropoffAddress,
      destinationLat: Number(order.dropoffLat),
      destinationLng: Number(order.dropoffLng),
      tariffCode: order.tariff?.code,
      estimatedPrice: this.estimatePrice(order),
      distanceToPickupKm,
      expiresAt: expiresAt.toISOString(),
    };

    // Баг 13: убираем дубль — клиент слушает только OrderOfferNew
    this.server?.to(Rooms.driver(driverId)).emit(SocketEvent.OrderOfferNew, payload);
  }

  private scheduleOfferExpiry(offerId: string, expiresAt: Date) {
    // Баг 9: храним TTL в Redis — при рестарте/масштабировании таймер восстанавливается
    const delay = Math.max(0, expiresAt.getTime() - Date.now());
    void this.redis.client.set(
      `${OFFER_EXPIRY_PREFIX}${offerId}`,
      '1',
      'PX',
      delay,
    );
    // Локальный setTimeout для текущего процесса — Redis ключ синхронизирует состояние
    const timer = setTimeout(async () => {
      const exists = await this.redis.client.exists(`${OFFER_EXPIRY_PREFIX}${offerId}`);
      if (exists) {
        // Другой инстанс уже обработал — пропускаем
        return;
      }
      void this.expireOffer(offerId);
    }, delay);
    timer.unref?.();
  }

  private clearOfferTimer(offerId: string) {
    // Удаляем Redis ключ — все инстансы перестанут обрабатывать этот оффер
    void this.redis.client.del(`${OFFER_EXPIRY_PREFIX}${offerId}`);
  }

  private async getDriverForUser(user: JwtUser) {
    const driver = await this.prisma.driver.findUnique({ where: { userId: user.sub } });
    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }
    return driver;
  }

  private toAvailableOffer(
    offer: Prisma.OrderOfferGetPayload<{ include: { order: { include: { tariff: true } } } }>,
  ) {
    return {
      offerId: offer.id,
      orderId: offer.orderId,
      pickupAddress: offer.order.pickupAddress,
      pickupLat: offer.order.pickupLat,
      pickupLng: offer.order.pickupLng,
      dropoffAddress: offer.order.dropoffAddress,
      dropoffLat: offer.order.dropoffLat,
      dropoffLng: offer.order.dropoffLng,
      tariff: offer.order.tariff,
      expiresAt: offer.expiresAt,
    };
  }

  private orderInclude() {
    return {
      passenger: { include: { user: true } },
      driver: { include: { user: true } },
      tariff: true,
      transactions: true,
      history: true,
      offers: true,
    } as const;
  }

  private estimatePrice(order: OrderWithMatchingData) {
    if (order.fareCents !== null && order.fareCents !== undefined) {
      return order.fareCents;
    }
    if (!order.tariff || !order.distanceMeters) {
      return undefined;
    }

    return this.pricingService.calculateTrip({
      tariffCode: order.tariff.code,
      distanceMeters: order.distanceMeters,
      waitingSeconds: 0,
      stopsCount: 0,
      tariff: order.tariff,
    }).total;
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const earthRadiusKm = 6371;
    const toRad = (value: number) => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
