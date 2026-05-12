import { Injectable, NotFoundException } from '@nestjs/common';
import { Tariff } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { UpdateTariffDto } from './dto/update-tariff.dto';

@Injectable()
export class TariffsService {
  constructor(private readonly prisma: PrismaService) {}

  findActive(): Promise<Tariff[]> {
    return this.prisma.tariff.findMany({
      where: { isActive: true },
      orderBy: { baseFare: 'asc' },
    });
  }

  async findActiveByCode(code: string): Promise<Tariff> {
    const tariff = await this.prisma.tariff.findFirst({
      where: {
        code,
        isActive: true,
      },
    });

    if (!tariff) {
      throw new NotFoundException(`Active tariff ${code} was not found`);
    }

    return tariff;
  }

  async findByCode(code: string): Promise<Tariff> {
    const tariff = await this.prisma.tariff.findUnique({
      where: { code },
    });

    if (!tariff) {
      throw new NotFoundException(`Tariff ${code} was not found`);
    }

    return tariff;
  }

  create(dto: CreateTariffDto): Promise<Tariff> {
    return this.prisma.tariff.create({
      data: {
        ...dto,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateTariffDto): Promise<Tariff> {
    await this.ensureExists(id);

    return this.prisma.tariff.update({
      where: { id },
      data: dto,
    });
  }

  async toggle(id: string): Promise<Tariff> {
    const tariff = await this.ensureExists(id);

    return this.prisma.tariff.update({
      where: { id },
      data: {
        isActive: !tariff.isActive,
      },
    });
  }

  private async ensureExists(id: string): Promise<Tariff> {
    const tariff = await this.prisma.tariff.findUnique({
      where: { id },
    });

    if (!tariff) {
      throw new NotFoundException(`Tariff ${id} was not found`);
    }

    return tariff;
  }
}
