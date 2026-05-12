export type TariffPricingConfig = {
  code: string;
  currency: string;
  carSupplyPrice: number;
  pricePerKm: number;
  freeWaitingMinutes: number;
  waitingPricePerMinute: number;
  stopPrice: number;
  minimumOrderPrice: number;
};

export type PriceBreakdown = {
  tariffCode: string;
  currency: string;
  distanceKm: number;
  billableWaitingMinutes: number;
  stopsCount: number;
  carSupplyPrice: number;
  distancePrice: number;
  waitingPrice: number;
  stopsPrice: number;
  subtotal: number;
  minimumOrderPrice: number;
  total: number;
};
