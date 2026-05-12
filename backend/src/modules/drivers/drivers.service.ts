import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.driver.findMany({ include: { user: true, balance: true }, orderBy: { createdAt: 'desc' } });
  }

  create(dto: CreateDriverDto) {
    return this.prisma.driver.create({ data: dto });
  }
}
