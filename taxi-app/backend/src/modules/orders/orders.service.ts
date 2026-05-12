import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DriverStatus, Order, OrderStatus, Prisma, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { PricingService } from '../pricing/pricing.service';
import { TariffsService } from '../tariffs/tariffs.service';
import { PrismaService } from '../../database/prisma.service';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { INTERNAL_REALTIME_EVENTS, OrderRealtimePayload } from '../realtime/realtime.events';

type OrderWithTariff = Order & {
  tariff: Awaited<ReturnType<TariffsService['findActiveByCode']>>;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tariffsService: TariffsService,
    private readonly pricingService: PricingService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateOrderDto): Promise<Order> {
    const passenger = await this.prisma.passenger.findUnique({
      where: { userId: user.id },
    });

    if (!passenger) {
      throw new ForbiddenException('Passenger profile was not found');
    }

    const tariff = await this.tariffsService.findActiveByCode(dto.tariffCode);
    const estimate = this.pricingService.calculate(tariff, {
      tariffCode: tariff.code,
      distanceKm: dto.distanceKm,
      waitingMinutes: 0,
      stopMinutes: 0,
    });

    const order = await this.prisma.order.create({
      data: {
        passengerId: passenger.id,
        tariffId: tariff.id,
        status: OrderStatus.SEARCHING,
        pickupAddress: dto.pickupAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        destinationAddress: dto.destinationAddress,
        destinationLat: dto.destinationLat,
        destinationLng: dto.destinationLng,
        distanceKm: dto.distanceKm,
        estimatedPrice: estimate.totalPrice,
      },
    });

    this.emitOrderEvent(INTERNAL_REALTIME_EVENTS.ORDER_CREATED, order);

    return order;
  }

  findAvailable(): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: { status: OrderStatus.SEARCHING },
      orderBy: { createdAt: 'asc' },
    });
  }

  async accept(user: AuthenticatedUser, orderId: string): Promise<Order> {
    const order = await this.prisma.$transaction(async (tx) => {
      const driver = await this.getDriverProfile(tx, user.id);

      if (driver.status !== DriverStatus.ONLINE) {
        throw new BadRequestException('Driver must be ONLINE to accept orders');
      }

      const updateResult = await tx.order.updateMany({
        where: {
          id: orderId,
          status: OrderStatus.SEARCHING,
          driverId: null,
        },
        data: {
          driverId: driver.id,
          status: OrderStatus.DRIVER_ASSIGNED,
          acceptedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        await this.ensureOrderExists(tx, orderId);
        throw new ConflictException('Order is no longer available');
      }

      await tx.driver.update({
        where: { id: driver.id },
        data: { status: DriverStatus.BUSY },
      });

      return this.getOrderOrThrow(tx, orderId);
    });

    this.emitOrderEvent(INTERNAL_REALTIME_EVENTS.ORDER_ACCEPTED, order);

    return order;
  }

  async markArrived(user: AuthenticatedUser, orderId: string): Promise<Order> {
    return this.transitionDriverOrder(user, orderId, {
      from: OrderStatus.DRIVER_ASSIGNED,
      to: OrderStatus.DRIVER_ARRIVED,
      timestampField: 'arrivedAt',
      event: INTERNAL_REALTIME_EVENTS.ORDER_DRIVER_ARRIVED,
    });
  }

  async start(user: AuthenticatedUser, orderId: string): Promise<Order> {
    return this.transitionDriverOrder(user, orderId, {
      from: OrderStatus.DRIVER_ARRIVED,
      to: OrderStatus.IN_PROGRESS,
      timestampField: 'startedAt',
      event: INTERNAL_REALTIME_EVENTS.ORDER_STARTED,
    });
  }

  async complete(user: AuthenticatedUser, orderId: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.prisma.$transaction(async (tx) => {
      const driver = await this.getDriverProfile(tx, user.id);
      const order = await this.getDriverOwnedOrder(tx, orderId, driver.id);

      this.assertMutable(order);
      this.assertStatus(order, OrderStatus.IN_PROGRESS);

      const estimate = this.pricingService.calculate(order.tariff, {
        tariffCode: order.tariff.code,
        distanceKm: dto.distanceKm,
        waitingMinutes: dto.waitingMinutes,
        stopMinutes: dto.stopMinutes,
      });

      const completedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.COMPLETED,
          completedAt: new Date(),
          distanceKm: dto.distanceKm,
          waitingMinutes: dto.waitingMinutes,
          stopMinutes: dto.stopMinutes,
          finalPrice: estimate.totalPrice,
        },
      });

      await tx.driver.update({
        where: { id: driver.id },
        data: { status: DriverStatus.ONLINE },
      });

      return completedOrder;
    });

    this.emitOrderEvent(INTERNAL_REALTIME_EVENTS.ORDER_COMPLETED, order);

    return order;
  }

  async cancel(user: AuthenticatedUser, orderId: string, _dto: CancelOrderDto): Promise<Order> {
    const order = await this.prisma.$transaction(async (tx) => {
      const order = await this.getOrderOrThrow(tx, orderId);

      this.assertMutable(order);
      await this.assertCanCancel(tx, user, order);

      const canceledOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELED,
          canceledAt: new Date(),
        },
      });

      if (order.driverId) {
        await tx.driver.update({
          where: { id: order.driverId },
          data: { status: DriverStatus.ONLINE },
        });
      }

      return canceledOrder;
    });

    this.emitOrderEvent(INTERNAL_REALTIME_EVENTS.ORDER_CANCELED, order);

    return order;
  }

  async findMine(user: AuthenticatedUser): Promise<Order[]> {
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Admins should use admin orders endpoint');
    }

    if (user.role === UserRole.PASSENGER) {
      const passenger = await this.prisma.passenger.findUnique({
        where: { userId: user.id },
      });

      if (!passenger) {
        throw new ForbiddenException('Passenger profile was not found');
      }

      return this.prisma.order.findMany({
        where: { passengerId: passenger.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    const driver = await this.prisma.driver.findUnique({
      where: { userId: user.id },
    });

    if (!driver) {
      throw new ForbiddenException('Driver profile was not found');
    }

    return this.prisma.order.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAdmin(query: AdminOrdersQueryDto): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async transitionDriverOrder(
    user: AuthenticatedUser,
    orderId: string,
    transition: {
      from: OrderStatus;
      to: OrderStatus;
      timestampField: 'arrivedAt' | 'startedAt';
      event: string;
    },
  ): Promise<Order> {
    const order = await this.prisma.$transaction(async (tx) => {
      const driver = await this.getDriverProfile(tx, user.id);
      const order = await this.getDriverOwnedOrder(tx, orderId, driver.id);

      this.assertMutable(order);
      this.assertStatus(order, transition.from);

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: transition.to,
          [transition.timestampField]: new Date(),
        },
      });
    });

    this.emitOrderEvent(transition.event, order);

    return order;
  }

  private async getDriverProfile(tx: Prisma.TransactionClient, userId: string) {
    const driver = await tx.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new ForbiddenException('Driver profile was not found');
    }

    return driver;
  }

  private async getDriverOwnedOrder(
    tx: Prisma.TransactionClient,
    orderId: string,
    driverId: string,
  ): Promise<OrderWithTariff> {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { tariff: true },
    });

    if (!order) {
      throw new NotFoundException('Order was not found');
    }

    if (order.driverId !== driverId) {
      throw new ForbiddenException('You cannot change another driver order');
    }

    return order;
  }

  private async getOrderOrThrow(tx: Prisma.TransactionClient, orderId: string): Promise<Order> {
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order was not found');
    }

    return order;
  }

  private async ensureOrderExists(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
    await this.getOrderOrThrow(tx, orderId);
  }

  private async assertCanCancel(
    tx: Prisma.TransactionClient,
    user: AuthenticatedUser,
    order: Order,
  ): Promise<void> {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role === UserRole.PASSENGER) {
      const passenger = await tx.passenger.findUnique({
        where: { userId: user.id },
      });

      if (passenger?.id === order.passengerId) {
        return;
      }
    }

    if (user.role === UserRole.DRIVER) {
      const driver = await tx.driver.findUnique({
        where: { userId: user.id },
      });

      if (driver?.id === order.driverId) {
        return;
      }
    }

    throw new ForbiddenException('You cannot cancel this order');
  }

  private assertMutable(order: Pick<Order, 'status'>): void {
    if (order.status === OrderStatus.CANCELED) {
      throw new BadRequestException('Canceled order cannot be changed');
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Completed order cannot be changed');
    }
  }

  private assertStatus(order: Pick<Order, 'status'>, expectedStatus: OrderStatus): void {
    if (order.status !== expectedStatus) {
      throw new BadRequestException(`Order must be ${expectedStatus}`);
    }
  }

  private emitOrderEvent(event: string, order: Order): void {
    const payload: OrderRealtimePayload = {
      order,
      passengerId: order.passengerId,
      driverId: order.driverId,
    };

    this.eventEmitter.emit(event, payload);
  }
}
