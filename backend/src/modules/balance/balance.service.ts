import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { Role } from '../../domain/auth/role.enum';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { JwtUser } from '../auth/auth.types';
import { PricingService } from '../pricing/pricing.service';
import { AdjustDriverBalanceDto, TopUpDriverDto } from './dto/balance-action.dto';

@Injectable()
export class BalanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  async getDriverBalance(user: JwtUser) {
    const driver = await this.getDriverForUser(user);
    const lastTransactions = await this.prisma.transaction.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      balance: driver.balance,
      commissionRatePercent: driver.commissionRatePercent,
      lastTransactions,
    };
  }

  async topUp(driverId: string, dto: TopUpDriverDto) {
    return this.applyAdminBalanceChange(driverId, dto.amount, TransactionType.TOP_UP, dto.description);
  }

  async adjust(driverId: string, dto: AdjustDriverBalanceDto) {
    return this.applyAdminBalanceChange(driverId, dto.amount, TransactionType.ADJUSTMENT, dto.description);
  }

  async completeOrderWithCommission(orderId: string, comment = 'Trip completed.') {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { driver: true, tariff: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }
      if (!order.driverId || !order.driver) {
        throw new ConflictException('Order has no assigned driver');
      }

      const existingCommission = await tx.transaction.findFirst({
        where: { orderId, driverId: order.driverId, type: TransactionType.TRIP_COMMISSION },
      });

      if (existingCommission && order.status === OrderStatus.COMPLETED) {
        return tx.order.findUniqueOrThrow({
          where: { id: orderId },
          include: this.orderInclude(),
        });
      }

      const finalPrice = this.calculateFinalPrice(order);
      const commission = Math.round((finalPrice * order.driver.commissionRatePercent) / 100);

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.COMPLETED,
          completedAt: new Date(),
          fareCents: finalPrice,
          history: {
            create: {
              status: OrderStatus.COMPLETED,
              comment,
            },
          },
        },
        include: this.orderInclude(),
      });

      if (!existingCommission) {
        await tx.driver.update({
          where: { id: order.driverId },
          data: { balance: { decrement: commission } },
        });

        await tx.transaction.create({
          data: {
            driverId: order.driverId,
            orderId,
            type: TransactionType.TRIP_COMMISSION,
            status: TransactionStatus.SUCCESS,
            amount: -commission,
            amountCents: -commission,
            currency: order.currency,
            description: `Platform commission ${order.driver.commissionRatePercent}% for order ${orderId}`,
          },
        });
      }

      return updatedOrder;
    });
  }

  private async applyAdminBalanceChange(
    driverId: string,
    amount: number,
    type: TransactionType,
    description?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const driver = await tx.driver.update({
        where: { id: driverId },
        data: { balance: { increment: amount } },
        include: { user: true },
      });

      const transaction = await tx.transaction.create({
        data: {
          driverId,
          type,
          status: TransactionStatus.SUCCESS,
          amount,
          amountCents: amount,
          currency: 'UZS',
          description,
        },
      });

      return { driver, transaction };
    });
  }

  private async getDriverForUser(user: JwtUser) {
    const driver = await this.prisma.driver.findUnique({ where: { userId: user.sub } });
    if (!driver || user.role !== Role.DRIVER) {
      throw new NotFoundException('Driver profile not found');
    }
    return driver;
  }

  private calculateFinalPrice(
    order: Prisma.OrderGetPayload<{ include: { driver: true; tariff: true } }>,
  ) {
    if (order.fareCents !== null && order.fareCents !== undefined) {
      return order.fareCents;
    }
    if (!order.tariff) {
      return 0;
    }

    return this.pricingService.calculateTrip({
      tariffCode: order.tariff.code,
      distanceMeters: order.distanceMeters ?? 0,
      waitingSeconds: 0,
      stopsCount: 0,
      tariff: order.tariff,
    }).total;
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
