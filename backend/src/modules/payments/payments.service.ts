import { Injectable } from '@nestjs/common';
import { TransactionStatus, TransactionType } from '@prisma/client';
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

  create(dto: CreatePaymentDto) {
    return this.prisma.transaction.create({
      data: {
        orderId: dto.orderId,
        amountCents: dto.amountCents,
        type: TransactionType.PAYMENT,
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
