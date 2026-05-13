import { PriceBreakdown } from '../pricing/pricing.types';

export type RouteEstimate = {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  geometry: string | null;
  tariffCode: string;
  estimatedPrice: number;
  pricingBreakdown: RoutePricingBreakdown;
};

export type RoutePricingBreakdown = {
  baseFare: number;
  distancePrice: number;
  waitingPrice: number;
  stopPrice: number;
  minimumFare: number;
  totalPrice: number;
};

export function toRoutePricingBreakdown(price: PriceBreakdown): RoutePricingBreakdown {
  return {
    baseFare: price.carSupplyPrice,
    distancePrice: price.distancePrice,
    waitingPrice: price.waitingPrice,
    stopPrice: price.stopsPrice,
    minimumFare: price.minimumOrderPrice,
    totalPrice: price.total,
  };
}
