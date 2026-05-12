import * as Location from 'expo-location';

export async function getCurrentDriverLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== 'granted') {
    throw new Error('Location permission denied');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    heading: location.coords.heading ?? undefined,
    speed: location.coords.speed ? Math.max(location.coords.speed * 3.6, 0) : undefined,
  };
}
