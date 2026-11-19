import * as Notifications from 'expo-notifications';
import {
  readLocationAccuracy,
  startTripLocationUpdates,
  stopTripLocationUpdates,
} from './location-service';
import type { TripLocationTransport } from './trip-location-transport';

async function readNotificationsGranted(): Promise<boolean | null> {
  const permission = await Notifications.getPermissionsAsync().catch(() => null);
  return permission === null ? null : permission.granted;
}

export const defaultTripLocationTransport: TripLocationTransport = {
  start: startTripLocationUpdates,
  stop: stopTripLocationUpdates,
  readAccuracy: readLocationAccuracy,
  readNotificationsGranted,
};
