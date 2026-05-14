import { StyleSheet, Text, View } from 'react-native';
import { DriverLocation, Order } from '../api/types';
import { DEFAULT_CITY } from '../config/city';
import { decodePolyline, getOrderDestination, RoutePoint } from '../utils/route';

type RoutePreviewMapProps = {
  order: Order | null;
  driverLocation?: DriverLocation | null;
};

const WIDTH = 320;
const HEIGHT = 220;

export function RoutePreviewMap({ order, driverLocation }: RoutePreviewMapProps) {
  const pickup = order
    ? { latitude: Number(order.pickupLat), longitude: Number(order.pickupLng) }
    : null;
  const destination = getOrderDestination(order);
  const routePoints = order?.status === 'IN_PROGRESS' ? decodePolyline(order.routeGeometry) : [];
  const allPoints = [
    ...routePoints,
    pickup,
    destination,
    driverLocation ? { latitude: driverLocation.latitude, longitude: driverLocation.longitude } : null,
  ].filter(isValidRoutePoint);
  const bounds = getBounds(allPoints);
  const scaledRoute = routePoints.map((point) => scalePoint(point, bounds));
  const scaledPickup = pickup ? scalePoint(pickup, bounds) : null;
  const scaledDestination = destination ? scalePoint(destination, bounds) : null;
  const scaledDriver = driverLocation
    ? scalePoint({ latitude: driverLocation.latitude, longitude: driverLocation.longitude }, bounds)
    : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.map}>
        {scaledRoute.length > 1
          ? scaledRoute.slice(1).map((point, index) => (
              <RouteSegment
                end={point}
                key={`${point.x}-${point.y}-${index}`}
                start={scaledRoute[index]}
              />
            ))
          : null}
        {scaledDriver ? <Marker label="Вы" point={scaledDriver} style={styles.driverMarker} /> : null}
        {scaledPickup ? <Marker label="A" point={scaledPickup} style={styles.pickupMarker} /> : null}
        {scaledDestination ? <Marker label="B" point={scaledDestination} style={styles.destinationMarker} /> : null}
        {!order?.routeGeometry ? <Text style={styles.hint}>Маршрут пока без geometry, показываем точки</Text> : null}
      </View>
    </View>
  );
}

function RouteSegment({ start, end }: { start: ScaledPoint; end: ScaledPoint }) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  const angle = `${Math.atan2(dy, dx)}rad`;

  return (
    <View
      style={[
        styles.segment,
        {
          left: start.x,
          top: start.y,
          transform: [{ rotateZ: angle }],
          width: length,
        },
      ]}
    />
  );
}

function Marker({ label, point, style }: { label: string; point: ScaledPoint; style: object }) {
  return (
    <View style={[styles.marker, style, { left: point.x - 11, top: point.y - 11 }]}>
      <Text style={styles.markerText}>{label}</Text>
    </View>
  );
}

type ScaledPoint = { x: number; y: number };

function isValidRoutePoint(point: RoutePoint | null): point is RoutePoint {
  return Boolean(point) && Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude);
}

function getBounds(points: RoutePoint[]) {
  const fallback = DEFAULT_CITY.bounds;
  if (points.length === 0) {
    return fallback;
  }
  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    minLat: minLat === maxLat ? minLat - 0.01 : minLat,
    maxLat: minLat === maxLat ? maxLat + 0.01 : maxLat,
    minLng: minLng === maxLng ? minLng - 0.01 : minLng,
    maxLng: minLng === maxLng ? maxLng + 0.01 : maxLng,
  };
}

function scalePoint(point: RoutePoint, bounds: ReturnType<typeof getBounds>): ScaledPoint {
  const padding = 24;
  const x =
    padding +
    ((point.longitude - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (WIDTH - padding * 2);
  const y =
    padding +
    ((bounds.maxLat - point.latitude) / (bounds.maxLat - bounds.minLat)) * (HEIGHT - padding * 2);
  return { x, y };
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#eef4ff',
    borderColor: '#d9dee7',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  map: {
    height: HEIGHT,
    position: 'relative',
    width: '100%',
  },
  segment: {
    backgroundColor: '#1d4ed8',
    borderRadius: 2,
    height: 4,
    position: 'absolute',
  },
  marker: {
    alignItems: 'center',
    borderColor: '#ffffff',
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    width: 22,
  },
  driverMarker: {
    backgroundColor: '#7c3aed',
  },
  pickupMarker: {
    backgroundColor: '#0f766e',
  },
  destinationMarker: {
    backgroundColor: '#dc2626',
  },
  markerText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  hint: {
    bottom: 8,
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
    left: 12,
    position: 'absolute',
  },
});
