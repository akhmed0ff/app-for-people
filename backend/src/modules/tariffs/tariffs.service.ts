import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { UpdateTariffDto } from './dto/update-tariff.dto';

@Injectable()
export class TariffsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tariff.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(dto: CreateTariffDto) {
    return this.prisma.tariff.create({ data: dto });
  }

  update(id: string, dto: UpdateTariffDto) {
    return this.prisma.tariff.update({ where: { id }, data: dto });
  }
}
