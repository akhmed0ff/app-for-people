import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { getDriverSocket } from '../../shared/socket/driver-socket';
import { useAuthStore } from '../../shared/store/auth.store';
import { useDriverStore } from '../../shared/store/driver.store';

export const DRIVER_LOCATION_TASK = 'driver-background-location-task';

type LocationTaskData = {
  locations: Location.LocationObject[];
};

TaskManager.defineTask(DRIVER_LOCATION_TASK, ({ data, error }) => {
  if (error) {
    return;
  }

  const { locations } = data as LocationTaskData;
  const latest = locations[locations.length - 1];
  const token = useAuthStore.getState().accessToken;
  const online = useDriverStore.getState().online;

  if (!latest || !token || !online) {
    return;
  }

  const payload = {
    latitude: latest.coords.latitude,
    longitude: latest.coords.longitude,
    heading: latest.coords.heading ?? undefined,
    speed: latest.coords.speed ?? undefined,
  };

  useDriverStore.getState().setLocation(payload);
  getDriverSocket(token).emit('driver.location.update', payload);
});
