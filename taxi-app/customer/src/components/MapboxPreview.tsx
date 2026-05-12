import { Image, StyleSheet, Text, View } from 'react-native';
import { env } from '../config/env';
import { DriverLocation } from '../types/api';
import { RouteDraft } from '../types/location';

interface MapboxPreviewProps {
  route: RouteDraft;
  driverLocation?: DriverLocation | null;
}

export function MapboxPreview({ route, driverLocation }: MapboxPreviewProps) {
  if (!env.mapboxToken || env.mapboxToken === 'replace-with-mapbox-token') {
    return (
      <View style={[styles.map, styles.fallback]}>
        <Text style={styles.fallbackText}>Добавьте EXPO_PUBLIC_MAPBOX_TOKEN, чтобы увидеть карту.</Text>
      </View>
    );
  }

  const markerParts = [
    `pin-s-a+111827(${route.pickup.lng},${route.pickup.lat})`,
    `pin-s-b+2563eb(${route.destination.lng},${route.destination.lat})`,
  ];

  if (driverLocation) {
    markerParts.push(`pin-s-car+dc2626(${driverLocation.lng},${driverLocation.lat})`);
  }

  const centerLng = (route.pickup.lng + route.destination.lng) / 2;
  const centerLat = (route.pickup.lat + route.destination.lat) / 2;
  const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markerParts.join(
    ',',
  )}/${centerLng},${centerLat},12,0/900x520@2x?access_token=${env.mapboxToken}`;

  return <Image source={{ uri: url }} style={styles.map} resizeMode="cover" />;
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 260,
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
