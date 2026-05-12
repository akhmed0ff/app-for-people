import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { EstimatePriceDto } from './dto/estimate-price.dto';
import { PriceBreakdown, TariffPricingConfig } from './pricing.types';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async estimate(dto: EstimatePriceDto) {
    const tariff = await this.prisma.tariff.findUnique({ where: { code: dto.tariffCode } });
    if (!tariff || !tariff.isActive) {
      throw new NotFoundException('Tariff not found');
    }

    return this.calculateTrip({
      tariffCode: tariff.code,
      distanceMeters: dto.distanceMeters,
      waitingSeconds: dto.waitingSeconds,
      stopsCount: dto.stopsCount ?? 0,
      tariff,
    });
  }

  calculateTrip(input: {
    tariffCode: string;
    distanceMeters: number;
    waitingSeconds: number;
    stopsCount: number;
    tariff: TariffPricingConfig;
  }): PriceBreakdown {
    const distanceKm = input.distanceMeters / 1000;
    const distancePrice = Math.ceil(distanceKm * input.tariff.pricePerKm);
    const waitingPrice = this.calculateWaiting(input.waitingSeconds, input.tariff);
    const stopsPrice = this.calculateStops(input.stopsCount, input.tariff);
    const subtotal = input.tariff.carSupplyPrice + distancePrice + waitingPrice + stopsPrice;
    const total = Math.max(subtotal, input.tariff.minimumOrderPrice);

    return {
      tariffCode: input.tariffCode,
      currency: input.tariff.currency,
      distanceKm,
      billableWaitingMinutes: this.getBillableWaitingMinutes(input.waitingSeconds, input.tariff),
      stopsCount: input.stopsCount,
      carSupplyPrice: input.tariff.carSupplyPrice,
      distancePrice,
      waitingPrice,
      stopsPrice,
      subtotal,
      minimumOrderPrice: input.tariff.minimumOrderPrice,
      total,
    };
  }

  calculateWaiting(waitingSeconds: number, tariff: TariffPricingConfig): number {
    return this.getBillableWaitingMinutes(waitingSeconds, tariff) * tariff.waitingPricePerMinute;
  }

  calculateStops(stopsCount: number, tariff: TariffPricingConfig): number {
    return Math.max(0, stopsCount) * tariff.stopPrice;
  }

  private getBillableWaitingMinutes(waitingSeconds: number, tariff: TariffPricingConfig): number {
    const totalWaitingMinutes = Math.ceil(Math.max(0, waitingSeconds) / 60);
    return Math.max(0, totalWaitingMinutes - tariff.freeWaitingMinutes);
  }
}
