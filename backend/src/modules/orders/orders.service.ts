import { ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '../../infrastructure/database/prisma-enums';
import { Role } from '../../domain/auth/role.enum';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { JwtUser } from '../auth/auth.types';
import { BalanceService } from '../balance/balance.service';
import { MatchingService } from '../matching/matching.service';
import { PricingService } from '../pricing/pricing.service';
import { RoutingService } from '../routing/routing.service';
import { RouteEstimate } from '../routing/routing.types';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly balanceService: BalanceService,
    private readonly matchingService: MatchingService,
    private readonly routingService: RoutingService,
    private readonly pricingService: PricingService,
    private readonly config: ConfigService,
  ) {}

  findForUser(user: JwtUser) {
    if (user.role === Role.ADMIN) {
      return this.findAll();
    }
    if (user.role === Role.DRIVER) {
      return this.prisma.order.findMany({
        where: { driver: { is: { userId: user.sub } } },
        include: this.orderInclude(),
        orderBy: { requestedAt: 'desc' },
      });
    }
    return this.prisma.order.findMany({
      where: { passenger: { is: { userId: user.sub } } },
      include: this.orderInclude(),
      orderBy: { requestedAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.order.findMany({
      include: this.orderInclude(),
      orderBy: { requestedAt: 'desc' },
    });
  }

  async create(user: JwtUser, dto: CreateOrderDto) {
    const passengerId =
      user.role === Role.PASSENGER
        ? (await this.prisma.passenger.findUniqueOrThrow({ where: { userId: user.sub } })).id
        : dto.passengerId;

    if (!passengerId) {
      throw new ConflictException('Passenger is required');
    }

    const route = await this.estimateRouteForOrder(dto);
    const dropoffAddress = dto.destinationAddress ?? dto.dropoffAddress;
    const dropoffLat = dto.destinationLat ?? dto.dropoffLat;
    const dropoffLng = dto.destinationLng ?? dto.dropoffLng;

    if (!dropoffAddress || dropoffLat === undefined || dropoffLng === undefined) {
      throw new ConflictException('Destination is required');
    }

    const order = await this.prisma.order.create({
      data: {
        passengerId,
        tariffId: await this.resolveTariffId(dto),
        pickupAddress: dto.pickupAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        dropoffAddress,
        dropoffLat,
        dropoffLng,
        paymentMethod: dto.paymentMethod,
        distanceMeters: route.distanceMeters,
        durationSeconds: route.durationSeconds,
        routeDurationMinutes: route.durationMinutes,
        routeGeometry: route.geometry,
        fareCents: route.estimatedPrice,
        history: {
          create: {
            status: OrderStatus.SEARCHING,
            comment: 'Order created.',
          },
        },
      },
      include: this.orderInclude(),
    });
    void this.matchingService.startMatching(order.id);
    return order;
  }

  availableOffers(user: JwtUser) {
    if (user.role !== Role.DRIVER) {
      return [];
    }
    return this.matchingService.getAvailableOffers(user);
  }

  currentOffer(user: JwtUser) {
    return this.matchingService.getCurrentOffer(user);
  }

  acceptOffer(user: JwtUser, offerId: string) {
    return this.matchingService.acceptOffer(user, offerId);
  }

  rejectOffer(user: JwtUser, offerId: string) {
    return this.matchingService.rejectOffer(user, offerId);
  }

  acceptOrder(user: JwtUser, orderId: string) {
    return this.matchingService.acceptOrder(user, orderId);
  }

  async assignDriver(user: JwtUser, orderId: string, dto: AssignDriverDto) {
    if (user.role === Role.DRIVER) {
      const driver = await this.prisma.driver.findUnique({ where: { userId: user.sub } });
      if (!driver || driver.id !== dto.driverId) {
        throw new ForbiddenException('Driver can only assign themselves');
      }
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        driverId: dto.driverId,
        status: OrderStatus.DRIVER_ASSIGNED,
        assignedAt: new Date(),
        history: {
          create: {
            status: OrderStatus.DRIVER_ASSIGNED,
            comment: 'Driver assigned.',
          },
        },
      },
    });
  }

  async complete(user: JwtUser, orderId: string) {
    if (user.role === Role.DRIVER) {
      await this.ensureAssignedDriver(user, orderId);
    }

    return this.balanceService.completeOrderWithCommission(orderId, `Completed by ${user.role}.`);
  }

  private async ensureAssignedDriver(user: JwtUser, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { driver: { select: { userId: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.driver?.userId !== user.sub) {
      throw new ForbiddenException('Driver can only manage their assigned order');
    }
  }

  private async estimateRouteForOrder(dto: CreateOrderDto): Promise<RouteEstimate> {
    const tariffCode = await this.resolveTariffCode(dto);
    const destinationLat = dto.destinationLat ?? dto.dropoffLat;
    const destinationLng = dto.destinationLng ?? dto.dropoffLng;

    if (destinationLat === undefined || destinationLng === undefined) {
      throw new ConflictException('Destination coordinates are required');
    }

    try {
      return await this.routingService.estimate({
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        destinationLat,
        destinationLng,
        tariffCode,
      });
    } catch (error) {
      if (this.canUseManualDistanceFallback(error, dto.distanceMeters)) {
        const price = await this.pricingService.estimate({
          tariffCode,
          distanceMeters: dto.distanceMeters!,
          waitingSeconds: 0,
          stopsCount: 0,
        });

        // Manual distance fallback is development-only.
        return {
          distanceMeters: dto.distanceMeters!,
          distanceKm: Number((dto.distanceMeters! / 1000).toFixed(2)),
          durationSeconds: 0,
          durationMinutes: 0,
          geometry: null,
          tariffCode: price.tariffCode,
          estimatedPrice: price.total,
          pricingBreakdown: {
            baseFare: price.carSupplyPrice,
            distancePrice: price.distancePrice,
            waitingPrice: price.waitingPrice,
            stopPrice: price.stopsPrice,
            minimumFare: price.minimumOrderPrice,
            totalPrice: price.total,
          },
        };
      }
      throw error;
    }
  }

  private canUseManualDistanceFallback(error: unknown, distanceMeters?: number) {
    const token = this.config.get<string>('MAPBOX_ACCESS_TOKEN');
    return (
      this.config.get<string>('NODE_ENV') === 'development' &&
      distanceMeters !== undefined &&
      (!token || token.startsWith('replace-with')) &&
      error instanceof ServiceUnavailableException
    );
  }

  private async resolveTariffCode(dto: CreateOrderDto) {
    if (dto.tariffCode) {
      return dto.tariffCode;
    }
    if (!dto.tariffId) {
      throw new ConflictException('Tariff is required');
    }
    const tariff = await this.prisma.tariff.findUnique({ where: { id: dto.tariffId } });
    if (!tariff) {
      throw new NotFoundException('Tariff not found');
    }
    return tariff.code;
  }

  private async resolveTariffId(dto: CreateOrderDto) {
    if (dto.tariffId) {
      return dto.tariffId;
    }
    if (!dto.tariffCode) {
      return undefined;
    }
    const tariff = await this.prisma.tariff.findUnique({ where: { code: dto.tariffCode } });
    if (!tariff) {
      throw new NotFoundException('Tariff not found');
    }
    return tariff.id;
  }

  private orderInclude() {
    return {
      passenger: { include: { user: true } },
      driver: { include: { user: true } },
      tariff: true,
      transactions: true,
      history: true,
    } as const;
  }
}
