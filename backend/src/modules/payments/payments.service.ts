import { Injectable } from '@nestjs/common';
import { TransactionStatus, TransactionType } from '../../infrastructure/database/prisma-enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.transaction.findMany({
      include: {
        order: true,
        user: true,
        driver: { include: { user: true } },
        passenger: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreatePaymentDto) {
    // Баг 8: привязываем транзакцию к водителю и пассажиру из заказа
    const order = dto.orderId
      ? await this.prisma.order.findUnique({
          where: { id: dto.orderId },
          select: { driverId: true, passengerId: true },
        })
      : null;

    return this.prisma.transaction.create({
      data: {
        orderId: dto.orderId,
        driverId: order?.driverId ?? undefined,
        passengerId: order?.passengerId ?? undefined,
        amount: dto.amountCents,
        amountCents: dto.amountCents,
        type: TransactionType.PAYMENT,
        status: TransactionStatus.SUCCESS,
        provider: dto.method.toLowerCase(),
      },
    });
  }

  markPaid(id: string) {
    return this.prisma.transaction.update({
      where: { id },
      data: { status: TransactionStatus.SUCCESS },
    });
  }
}
