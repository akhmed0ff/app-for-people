import * as Location from 'expo-location';
import { getDriverSocket } from '../../shared/socket/driver-socket';
import { useAuthStore } from '../../shared/store/auth.store';
import { useDriverStore } from '../../shared/store/driver.store';
import { DRIVER_LOCATION_TASK } from './location-task';

let foregroundSubscription: Location.LocationSubscription | null = null;
let lastSentAt = 0;
let lastCoords: { latitude: number; longitude: number } | null = null;

const MIN_UPDATE_INTERVAL_MS = 7000;
const MIN_DISTANCE_METERS = 25;

export async function requestLocationPermissions() {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') {
    return false;
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  return background.status === 'granted';
}

export async function startDriverTracking() {
  const granted = await requestLocationPermissions();
  if (!granted) {
    return false;
  }

  foregroundSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: MIN_DISTANCE_METERS,
      timeInterval: MIN_UPDATE_INTERVAL_MS,
    },
    (location) => {
      emitLocation(location);
    },
  );

  const started = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
  if (!started) {
    await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      activityType: Location.ActivityType.AutomotiveNavigation,
      deferredUpdatesDistance: 50,
      deferredUpdatesInterval: 15000,
      distanceInterval: MIN_DISTANCE_METERS,
      foregroundService: {
        notificationTitle: 'Taxi Driver онлайн',
        notificationBody: 'Передаем геолокацию для заказов.',
      },
      pausesUpdatesAutomatically: true,
      showsBackgroundLocationIndicator: true,
      timeInterval: MIN_UPDATE_INTERVAL_MS,
    });
  }

  return true;
}

export async function stopDriverTracking() {
  foregroundSubscription?.remove();
  foregroundSubscription = null;
  const started = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
  if (started) {
    await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
  }
}

function emitLocation(location: Location.LocationObject) {
  const now = Date.now();
  const coords = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };

  if (now - lastSentAt < MIN_UPDATE_INTERVAL_MS && distanceMeters(lastCoords, coords) < MIN_DISTANCE_METERS) {
    return;
  }

  const token = useAuthStore.getState().accessToken;
  const online = useDriverStore.getState().online;
  if (!token || !online) {
    return;
  }

  const payload = {
    ...coords,
    heading: location.coords.heading ?? undefined,
    speed: location.coords.speed ?? undefined,
  };

  lastSentAt = now;
  lastCoords = coords;
  useDriverStore.getState().setLocation(payload);
  getDriverSocket(token).emit('driver.location.update', payload);
}

function distanceMeters(
  from: { latitude: number; longitude: number } | null,
  to: { latitude: number; longitude: number },
) {
  if (!from) {
    return Number.POSITIVE_INFINITY;
  }
  const earthRadiusMeters = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
