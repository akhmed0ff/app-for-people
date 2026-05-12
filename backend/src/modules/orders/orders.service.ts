import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Role } from '../../domain/auth/role.enum';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { JwtUser } from '../auth/auth.types';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.order.create({
      data: {
        ...dto,
        passengerId,
        history: {
          create: {
            status: OrderStatus.SEARCHING,
            comment: 'Order created.',
          },
        },
      },
      include: this.orderInclude(),
    });
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

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED, completedAt: new Date() },
    });
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
