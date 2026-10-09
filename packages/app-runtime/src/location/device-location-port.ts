import * as Location from 'expo-location';
import { Coordinate } from '@voyyaa/shared';
import { withinDeadline } from './within-deadline';

export const LOCATION_MAX_AGE_MS = 60_000;
export const LOCATION_REQUIRED_ACCURACY_M = 100;

export type DeviceLocationUnavailableReason =
  'services_disabled' | 'timeout' | 'position_unavailable';

export type DeviceLocationOutcome =
  | { kind: 'granted'; coordinate: Coordinate }
  | { kind: 'permission_denied'; canAskAgain: boolean }
  | { kind: 'consent_required' }
  | { kind: 'unavailable'; reason: DeviceLocationUnavailableReason };

export interface DeviceLocationRequestOptions {
  timeoutMs: number;
}

export interface DeviceLocationPort {
  requestLocation: (options: DeviceLocationRequestOptions) => Promise<DeviceLocationOutcome>;
}

export const unavailableDeviceLocationPort: DeviceLocationPort = {
  requestLocation: async () => ({ kind: 'unavailable', reason: 'position_unavailable' }),
};

const TIMED_OUT: DeviceLocationOutcome = { kind: 'unavailable', reason: 'timeout' };

async function acquireLocation(): Promise<DeviceLocationOutcome> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    return { kind: 'permission_denied', canAskAgain: permission.canAskAgain };
  }
  if (!(await Location.hasServicesEnabledAsync())) {
    return { kind: 'unavailable', reason: 'services_disabled' };
  }
  const position =
    (await Location.getLastKnownPositionAsync({
      maxAge: LOCATION_MAX_AGE_MS,
      requiredAccuracy: LOCATION_REQUIRED_ACCURACY_M,
    })) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  const parsed = Coordinate.safeParse({
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  });
  if (!parsed.success) return { kind: 'unavailable', reason: 'position_unavailable' };
  return { kind: 'granted', coordinate: parsed.data };
}

export const expoDeviceLocationPort: DeviceLocationPort = {
  requestLocation: ({ timeoutMs }) =>
    withinDeadline(
      acquireLocation().catch((): DeviceLocationOutcome => ({
        kind: 'unavailable',
        reason: 'position_unavailable',
      })),
      timeoutMs,
      () => TIMED_OUT,
    ),
};
