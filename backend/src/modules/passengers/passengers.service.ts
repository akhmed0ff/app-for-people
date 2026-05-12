import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreatePassengerDto } from './dto/create-passenger.dto';

@Injectable()
export class PassengersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.passenger.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
  }

  findByUserId(userId: string) {
    return this.prisma.passenger.findUniqueOrThrow({
      where: { userId },
      include: { user: true },
    });
  }

  create(dto: CreatePassengerDto) {
    return this.prisma.passenger.create({ data: dto });
  }
}
