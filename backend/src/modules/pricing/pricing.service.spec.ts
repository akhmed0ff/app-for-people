import { PricingService } from './pricing.service';
import { TariffPricingConfig } from './pricing.types';

const economy: TariffPricingConfig = {
  code: 'ECONOMY',
  currency: 'UZS',
  carSupplyPrice: 8000,
  pricePerKm: 2000,
  freeWaitingMinutes: 3,
  waitingPricePerMinute: 500,
  stopPrice: 1000,
  minimumOrderPrice: 8000,
};

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(() => {
    service = new PricingService({} as never);
  });

  it('calculates trip price with car supply and distance', () => {
    const result = service.calculateTrip({
      tariffCode: economy.code,
      tariff: economy,
      distanceMeters: 3500,
      waitingSeconds: 0,
      stopsCount: 0,
    });

    expect(result.carSupplyPrice).toBe(8000);
    expect(result.distancePrice).toBe(7000);
    expect(result.waitingPrice).toBe(0);
    expect(result.stopsPrice).toBe(0);
    expect(result.total).toBe(15000);
  });

  it('does not charge waiting inside free waiting window', () => {
    expect(service.calculateWaiting(180, economy)).toBe(0);
  });

  it('charges waiting after free waiting window and rounds up minutes', () => {
    expect(service.calculateWaiting(241, economy)).toBe(1000);
  });

  it('calculates stops price', () => {
    expect(service.calculateStops(3, economy)).toBe(3000);
  });

  it('applies minimum order price', () => {
    const minimumTariff = { ...economy, minimumOrderPrice: 15000 };
    const result = service.calculateTrip({
      tariffCode: minimumTariff.code,
      tariff: minimumTariff,
      distanceMeters: 1,
      waitingSeconds: 0,
      stopsCount: 0,
    });

    expect(result.total).toBe(15000);
  });
});
