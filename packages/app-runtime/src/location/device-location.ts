import { Platform } from 'react-native';
import {
  expoDeviceLocationPort,
  unavailableDeviceLocationPort,
  type DeviceLocationOutcome,
  type DeviceLocationPort,
} from './device-location-port';

export const LOCATION_BLOCKING_TIMEOUT_MS = 10_000;
export const LOCATION_BEST_EFFORT_TIMEOUT_MS = 5_000;
export const LOCATION_MAX_AGE_MS = 60_000;
export const LOCATION_REQUIRED_ACCURACY_M = 100;

let activePort: DeviceLocationPort =
  Platform.OS === 'web' ? unavailableDeviceLocationPort : expoDeviceLocationPort;

export function setDeviceLocationPort(port: DeviceLocationPort): void {
  activePort = port;
}

export function requestDeviceLocation(): Promise<DeviceLocationOutcome> {
  return activePort.requestLocation({ timeoutMs: LOCATION_BLOCKING_TIMEOUT_MS });
}

export function requestDeviceLocationBestEffort(): Promise<DeviceLocationOutcome> {
  return activePort.requestLocation({ timeoutMs: LOCATION_BEST_EFFORT_TIMEOUT_MS });
}
