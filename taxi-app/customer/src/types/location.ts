export interface Point {
  address: string;
  lat: number;
  lng: number;
}

export interface RouteDraft {
  pickup: Point;
  destination: Point;
  distanceKm: number;
}
