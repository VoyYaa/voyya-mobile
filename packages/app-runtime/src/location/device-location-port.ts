import * as Location from 'expo-location';
import { Coordinate } from '@voyyaa/shared';
import { LOCATION_MAX_AGE_MS, LOCATION_REQUIRED_ACCURACY_M } from './device-location';

export type DeviceLocationUnavailableReason =
  'services_disabled' | 'timeout' | 'position_unavailable';

export type DeviceLocationOutcome =
  | { kind: 'granted'; coordinate: Coordinate }
  | { kind: 'permission_denied'; canAskAgain: boolean }
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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export const expoDeviceLocationPort: DeviceLocationPort = {
  requestLocation: async ({ timeoutMs }) => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      return { kind: 'permission_denied', canAskAgain: permission.canAskAgain };
    }
    if (!(await Location.hasServicesEnabledAsync())) {
      return { kind: 'unavailable', reason: 'services_disabled' };
    }
    try {
      const cached = await Location.getLastKnownPositionAsync({
        maxAge: LOCATION_MAX_AGE_MS,
        requiredAccuracy: LOCATION_REQUIRED_ACCURACY_M,
      });
      const position =
        cached ??
        (await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          timeoutMs,
        ));
      if (position === null) return { kind: 'unavailable', reason: 'timeout' };
      const parsed = Coordinate.safeParse({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      if (!parsed.success) return { kind: 'unavailable', reason: 'position_unavailable' };
      return { kind: 'granted', coordinate: parsed.data };
    } catch {
      return { kind: 'unavailable', reason: 'position_unavailable' };
    }
  },
};
