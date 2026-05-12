export interface PriceEstimate {
  tariffCode: string;
  distanceKm: number;
  baseFare: number;
  distancePrice: number;
  waitingPrice: number;
  stopPrice: number;
  minimumFare: number;
  totalPrice: number;
}
