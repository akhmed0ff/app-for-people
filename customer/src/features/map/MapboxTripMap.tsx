import Mapbox from '@rnmapbox/maps';
import { ComponentType, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { env } from '../../shared/config/env';
import { DriverLocation, Point } from '../../shared/api/types';

Mapbox.setAccessToken(env.mapboxAccessToken);

const MapView = Mapbox.MapView as unknown as ComponentType<{
  children?: ReactNode;
  scaleBarEnabled?: boolean;
  style?: unknown;
}>;
const Camera = Mapbox.Camera as unknown as ComponentType<{
  centerCoordinate: [number, number];
  zoomLevel: number;
}>;
const PointAnnotation = Mapbox.PointAnnotation as unknown as ComponentType<{
  children?: ReactNode;
  coordinate: [number, number];
  id: string;
}>;

type MapboxTripMapProps = {
  pickup: Point | null;
  dropoff: Point | null;
  driverLocation?: DriverLocation | null;
};

const tashkent: [number, number] = [69.2401, 41.2995];

export function MapboxTripMap({ pickup, dropoff, driverLocation }: MapboxTripMapProps) {
  const center: [number, number] = pickup
    ? [pickup.longitude, pickup.latitude]
    : driverLocation
      ? [driverLocation.longitude, driverLocation.latitude]
      : tashkent;

  return (
    <View style={styles.wrap}>
      <MapView style={styles.map} scaleBarEnabled={false}>
        <Camera centerCoordinate={center} zoomLevel={12} />
        {pickup ? (
          <PointAnnotation coordinate={[pickup.longitude, pickup.latitude]} id="pickup">
            <View style={[styles.marker, styles.pickupMarker]} />
          </PointAnnotation>
        ) : null}
        {dropoff ? (
          <PointAnnotation coordinate={[dropoff.longitude, dropoff.latitude]} id="dropoff">
            <View style={[styles.marker, styles.dropoffMarker]} />
          </PointAnnotation>
        ) : null}
        {driverLocation ? (
          <PointAnnotation
            coordinate={[driverLocation.longitude, driverLocation.latitude]}
            id={`driver-${driverLocation.driverId}`}
          >
            <View style={[styles.marker, styles.driverMarker]} />
          </PointAnnotation>
        ) : null}
      </MapView>
    </View>
  );
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
  marker: {
    borderColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    width: 16,
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
