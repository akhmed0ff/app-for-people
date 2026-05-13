import { Order } from '../api/types';

export type RoutePoint = {
  latitude: number;
  longitude: number;
};

export function decodePolyline(polyline?: string | null): RoutePoint[] {
  if (!polyline) {
    return [];
  }

  const points: RoutePoint[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  try {
    while (index < polyline.length) {
      const latChange = decodeChunk(polyline, index);
      index = latChange.nextIndex;
      latitude += latChange.value;

      const lngChange = decodeChunk(polyline, index);
      index = lngChange.nextIndex;
      longitude += lngChange.value;

      points.push({ latitude: latitude / 100000, longitude: longitude / 100000 });
    }
  } catch {
    return [];
  }

  return points;
}

export function getOrderDestination(order: Order | null) {
  if (!order) {
    return null;
  }
  return {
    address: order.destinationAddress ?? order.dropoffAddress,
    latitude: Number(order.destinationLat ?? order.dropoffLat),
    longitude: Number(order.destinationLng ?? order.dropoffLng),
  };
}

export function getOrderDistanceKm(order: Order | null) {
  if (!order) {
    return null;
  }
  if (typeof order.distanceKm === 'number') {
    return order.distanceKm;
  }
  if (typeof order.distanceMeters === 'number') {
    return Number((order.distanceMeters / 1000).toFixed(1));
  }
  return null;
}

export function getOrderEtaMinutes(order: Order | null) {
  if (!order) {
    return null;
  }
  if (typeof order.routeDurationMinutes === 'number') {
    return order.routeDurationMinutes;
  }
  if (typeof order.durationSeconds === 'number') {
    return Math.ceil(order.durationSeconds / 60);
  }
  return null;
}

export function getOrderEstimatedPrice(order: Order | null) {
  if (!order) {
    return null;
  }
  return order.estimatedPrice ?? order.fareCents ?? null;
}

function decodeChunk(polyline: string, startIndex: number) {
  let result = 0;
  let shift = 0;
  let index = startIndex;
  let byte = 0;

  do {
    byte = polyline.charCodeAt(index) - 63;
    index += 1;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20 && index < polyline.length);

  return {
    nextIndex: index,
    value: result & 1 ? ~(result >> 1) : result >> 1,
  };
}
