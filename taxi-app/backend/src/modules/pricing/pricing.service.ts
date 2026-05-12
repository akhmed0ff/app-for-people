import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Tariff } from '@prisma/client';
import { TariffsService } from '../tariffs/tariffs.service';
import { EstimatePriceDto } from './dto/estimate-price.dto';
import { PriceEstimate } from './pricing.types';

@Injectable()
export class PricingService {
  constructor(private readonly tariffsService: TariffsService) {}

  async estimate(dto: EstimatePriceDto): Promise<PriceEstimate> {
    const tariff = await this.tariffsService.findByCode(dto.tariffCode);

    if (!tariff.isActive) {
      throw new UnprocessableEntityException(`Tariff ${dto.tariffCode} is inactive`);
    }

    return this.calculate(tariff, dto);
  }

  calculate(tariff: Tariff, dto: EstimatePriceDto): PriceEstimate {
    const distancePrice = this.roundMoney(dto.distanceKm * tariff.pricePerKm);
    const waitingPrice = this.calculateWaitingPrice(tariff, dto.waitingMinutes);
    const stopPrice = this.roundMoney(dto.stopMinutes * tariff.stopPricePerMinute);
    const subtotal = tariff.baseFare + distancePrice + waitingPrice + stopPrice;
    const totalPrice = Math.max(this.roundMoney(subtotal), tariff.minimumFare);

    return {
      tariffCode: tariff.code,
      distanceKm: dto.distanceKm,
      baseFare: tariff.baseFare,
      distancePrice,
      waitingPrice,
      stopPrice,
      minimumFare: tariff.minimumFare,
      totalPrice,
    };
  }

  private calculateWaitingPrice(tariff: Tariff, waitingMinutes: number): number {
    const paidWaitingMinutes = Math.max(waitingMinutes - tariff.freeWaitingMinutes, 0);

    return this.roundMoney(paidWaitingMinutes * tariff.waitingPricePerMinute);
  }

  private roundMoney(value: number): number {
    return Math.round(value);
  }
}
