import { Image, StyleSheet, Text, View } from 'react-native';
import { env } from '../config/env';
import { DriverLocation, Order } from '../types/api';

export function MapboxPreview({
  order,
  location,
}: {
  order?: Order | null;
  location?: DriverLocation | { lat: number; lng: number } | null;
}) {
  if (!env.mapboxToken || env.mapboxToken === 'replace-with-mapbox-token') {
    return (
      <View style={[styles.map, styles.fallback]}>
        <Text style={styles.fallbackText}>Добавьте EXPO_PUBLIC_MAPBOX_TOKEN, чтобы увидеть карту.</Text>
      </View>
    );
  }

  const markers: string[] = [];
  let centerLat = location?.lat ?? 41.311081;
  let centerLng = location?.lng ?? 69.240562;

  if (location) {
    markers.push(`pin-s-car+111827(${location.lng},${location.lat})`);
  }

  if (order) {
    markers.push(`pin-s-a+2563eb(${order.pickupLng},${order.pickupLat})`);
    markers.push(`pin-s-b+dc2626(${order.destinationLng},${order.destinationLat})`);
    centerLat = (order.pickupLat + order.destinationLat) / 2;
    centerLng = (order.pickupLng + order.destinationLng) / 2;
  }

  const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markers.join(
    ',',
  )}/${centerLng},${centerLat},12,0/900x520@2x?access_token=${env.mapboxToken}`;

  return <Image source={{ uri: url }} style={styles.map} resizeMode="cover" />;
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  fallbackText: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
});
