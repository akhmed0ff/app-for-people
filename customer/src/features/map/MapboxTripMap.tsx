import Constants from 'expo-constants';
import { ComponentType, ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DriverLocation, Point } from '../../shared/api/types';
import { DEFAULT_CITY } from '../../shared/config/city';
import { env } from '../../shared/config/env';

type MapboxTripMapProps = {
  pickup: Point | null;
  dropoff: Point | null;
  driverLocation?: DriverLocation | null;
};

type MapboxModule = {
  default: {
    Camera: unknown;
    MapView: unknown;
    PointAnnotation: unknown;
    setAccessToken: (token?: string) => void;
  };
};

type MapPoint = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  style: object;
};

const defaultCityCenter: [number, number] = [DEFAULT_CITY.center.longitude, DEFAULT_CITY.center.latitude];
const isExpoGo = Constants.appOwnership === 'expo';

export function MapboxTripMap({ pickup, dropoff, driverLocation }: MapboxTripMapProps) {
  const mapbox = useMemo(() => loadMapbox(), []);
  const points = getPoints(pickup, dropoff, driverLocation);

  if (!mapbox) {
    return <FallbackMap points={points} />;
  }

  const MapView = mapbox.default.MapView as ComponentType<{
    children?: ReactNode;
    scaleBarEnabled?: boolean;
    style?: unknown;
  }>;
  const Camera = mapbox.default.Camera as ComponentType<{
    centerCoordinate: [number, number];
    zoomLevel: number;
  }>;
  const PointAnnotation = mapbox.default.PointAnnotation as ComponentType<{
    children?: ReactNode;
    coordinate: [number, number];
    id: string;
  }>;

  const center: [number, number] =
    pickup && dropoff
      ? [(pickup.longitude + dropoff.longitude) / 2, (pickup.latitude + dropoff.latitude) / 2]
      : pickup
        ? [pickup.longitude, pickup.latitude]
        : driverLocation
          ? [driverLocation.longitude, driverLocation.latitude]
          : defaultCityCenter;
  const zoomLevel = pickup && dropoff ? DEFAULT_CITY.routeZoom : DEFAULT_CITY.mapZoom;

  return (
    <View style={styles.wrap}>
      <MapView style={styles.map} scaleBarEnabled={false}>
        <Camera centerCoordinate={center} zoomLevel={zoomLevel} />
        {points.map((point) => (
          <PointAnnotation coordinate={[point.longitude, point.latitude]} id={point.id} key={point.id}>
            <View style={[styles.marker, point.style]} />
          </PointAnnotation>
        ))}
      </MapView>
    </View>
  );
}

function loadMapbox(): MapboxModule | null {
  if (isExpoGo || !env.mapboxAccessToken) {
    return null;
  }

  try {
    // @rnmapbox/maps is not bundled in Expo Go. Require it only for development builds.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mapbox = require('@rnmapbox/maps') as MapboxModule;
    mapbox.default.setAccessToken(env.mapboxAccessToken);
    return mapbox;
  } catch {
    return null;
  }
}

function FallbackMap({ points }: { points: MapPoint[] }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.fallbackMap}>
        <Text style={styles.fallbackTitle}>Ангрен</Text>
        <Text style={styles.fallbackSubtitle}>Карта доступна в development build. В Expo Go показаны точки поездки.</Text>
        <View style={styles.pointList}>
          {points.length ? (
            points.map((point) => (
              <View key={point.id} style={styles.pointRow}>
                <View style={[styles.smallMarker, point.style]} />
                <Text style={styles.pointText}>
                  {point.label}: {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.pointText}>Центр: {DEFAULT_CITY.center.latitude}, {DEFAULT_CITY.center.longitude}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function getPoints(
  pickup: Point | null,
  dropoff: Point | null,
  driverLocation?: DriverLocation | null,
): MapPoint[] {
  return [
    pickup
      ? {
          id: 'pickup',
          label: 'Подача',
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          style: styles.pickupMarker,
        }
      : null,
    dropoff
      ? {
          id: 'dropoff',
          label: 'Назначение',
          latitude: dropoff.latitude,
          longitude: dropoff.longitude,
          style: styles.dropoffMarker,
        }
      : null,
    driverLocation
      ? {
          id: `driver-${driverLocation.driverId}`,
          label: 'Водитель',
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          style: styles.driverMarker,
        }
      : null,
  ].filter(Boolean) as MapPoint[];
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 8,
    height: 300,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  fallbackMap: {
    backgroundColor: '#e7f3ef',
    borderColor: '#c9ddd7',
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  fallbackTitle: {
    color: '#0f3f3a',
    fontSize: 24,
    fontWeight: '900',
  },
  fallbackSubtitle: {
    color: '#47645f',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  pointList: {
    gap: 8,
    marginTop: 18,
  },
  pointRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  pointText: {
    color: '#17202a',
    fontSize: 13,
    fontWeight: '700',
  },
  marker: {
    borderColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    width: 16,
  },
  smallMarker: {
    borderColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    width: 12,
  },
  pickupMarker: {
    backgroundColor: '#0f766e',
  },
  dropoffMarker: {
    backgroundColor: '#dc2626',
  },
  driverMarker: {
    backgroundColor: '#2563eb',
  },
});
