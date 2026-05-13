import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '../../domain/auth/role.enum';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { JwtUser } from '../auth/auth.types';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findForDriver(user: JwtUser) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId: user.sub },
      select: { id: true },
    });

    if (!driver || user.role !== Role.DRIVER) {
      throw new NotFoundException('Driver profile not found');
    }

    return this.findForDriverId(driver.id);
  }

  async findForDriverId(driverId: string) {
    return this.prisma.transaction.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
