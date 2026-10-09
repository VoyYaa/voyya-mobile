import * as Location from 'expo-location';
import { driverCopy } from '../copy/driver-copy';
import type { LocationAccuracy } from './sharing-machine';

export const TRIP_LOCATION_TASK = 'voyya-trip-location-sharing';

const NOTIFICATION_COLOR = '#F4A21A';
const MS_PER_SEC = 1000;

export async function stopTripLocationUpdates(): Promise<void> {
  const started = await Location.hasStartedLocationUpdatesAsync(TRIP_LOCATION_TASK).catch(
    () => false,
  );
  if (started) await Location.stopLocationUpdatesAsync(TRIP_LOCATION_TASK);
}

export async function startTripLocationUpdates(intervalSec: number): Promise<void> {
  await stopTripLocationUpdates();
  await Location.startLocationUpdatesAsync(TRIP_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: intervalSec * MS_PER_SEC,
    distanceInterval: 0,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: false,
    foregroundService: {
      notificationTitle: driverCopy.sharing.notificationTitle,
      notificationBody: driverCopy.sharing.notificationBody,
      notificationColor: NOTIFICATION_COLOR,
      killServiceOnDestroy: true,
    },
  });
}

export async function readLocationAccuracy(): Promise<LocationAccuracy> {
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== 'granted') return 'none';
    return permission.android?.accuracy ?? 'unknown';
  } catch {
    return 'unknown';
  }
}
