import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const [users, drivers, passengers, orders, transactions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.driver.count(),
      this.prisma.passenger.count(),
      this.prisma.order.count(),
      this.prisma.transaction.count(),
    ]);

    return { users, drivers, passengers, orders, transactions };
  }
}
