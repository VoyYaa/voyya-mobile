import { isLocationConsentConfirmed } from '../consent/location-consent';
import {
  expoDeviceLocationPort,
  type DeviceLocationOutcome,
  type DeviceLocationPort,
} from './device-location-port';
import { createConsentGatedLocationPort } from './location-gate';

export const LOCATION_BLOCKING_TIMEOUT_MS = 10_000;
export const LOCATION_BEST_EFFORT_TIMEOUT_MS = 5_000;

let activePort: DeviceLocationPort = expoDeviceLocationPort;

export function setDeviceLocationPort(port: DeviceLocationPort): void {
  activePort = port;
}

function gatedPort(): DeviceLocationPort {
  return createConsentGatedLocationPort(activePort, isLocationConsentConfirmed);
}

export function requestDeviceLocation(): Promise<DeviceLocationOutcome> {
  return gatedPort().requestLocation({ timeoutMs: LOCATION_BLOCKING_TIMEOUT_MS });
}

export function requestDeviceLocationBestEffort(): Promise<DeviceLocationOutcome> {
  return gatedPort().requestLocation({ timeoutMs: LOCATION_BEST_EFFORT_TIMEOUT_MS });
}
