import { UnprocessableEntityException } from '@nestjs/common';
import { Tariff } from '@prisma/client';
import { PricingService } from './pricing.service';

const economyTariff: Tariff = {
  id: 'tariff_1',
  code: 'ECONOMY',
  name: 'Эконом',
  baseFare: 8000,
  pricePerKm: 2000,
  freeWaitingMinutes: 3,
  waitingPricePerMinute: 500,
  stopPricePerMinute: 500,
  minimumFare: 10000,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PricingService', () => {
  const createService = (tariff: Tariff = economyTariff) => {
    const tariffsService = {
      findByCode: jest.fn().mockResolvedValue(tariff),
    };
    const service = new PricingService(tariffsService as never);

    return { service, tariffsService };
  };

  it('calculates a regular trip', async () => {
    const { service } = createService();

    await expect(
      service.estimate({
        tariffCode: 'ECONOMY',
        distanceKm: 4.7,
        waitingMinutes: 0,
        stopMinutes: 0,
      }),
    ).resolves.toEqual({
      tariffCode: 'ECONOMY',
      distanceKm: 4.7,
      baseFare: 8000,
      distancePrice: 9400,
      waitingPrice: 0,
      stopPrice: 0,
      minimumFare: 10000,
      totalPrice: 17400,
    });
  });

  it('does not charge free waiting minutes', async () => {
    const { service } = createService();

    const result = await service.estimate({
      tariffCode: 'ECONOMY',
      distanceKm: 2,
      waitingMinutes: 3,
      stopMinutes: 0,
    });

    expect(result.waitingPrice).toBe(0);
    expect(result.totalPrice).toBe(12000);
  });

  it('charges only paid waiting minutes', async () => {
    const { service } = createService();

    const result = await service.estimate({
      tariffCode: 'ECONOMY',
      distanceKm: 2,
      waitingMinutes: 5,
      stopMinutes: 0,
    });

    expect(result.waitingPrice).toBe(1000);
    expect(result.totalPrice).toBe(13000);
  });

  it('adds stop price', async () => {
    const { service } = createService();

    const result = await service.estimate({
      tariffCode: 'ECONOMY',
      distanceKm: 2,
      waitingMinutes: 0,
      stopMinutes: 4,
    });

    expect(result.stopPrice).toBe(2000);
    expect(result.totalPrice).toBe(14000);
  });

  it('applies minimum fare', async () => {
    const { service } = createService();

    const result = await service.estimate({
      tariffCode: 'ECONOMY',
      distanceKm: 0.1,
      waitingMinutes: 0,
      stopMinutes: 0,
    });

    expect(result.distancePrice).toBe(200);
    expect(result.totalPrice).toBe(10000);
  });

  it('rejects inactive tariff', async () => {
    const { service } = createService({
      ...economyTariff,
      isActive: false,
    });

    await expect(
      service.estimate({
        tariffCode: 'ECONOMY',
        distanceKm: 1,
        waitingMinutes: 0,
        stopMinutes: 0,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
