import {
  expoDeviceLocationPort,
  type DeviceLocationOutcome,
  type DeviceLocationPort,
} from './device-location-port';

export const LOCATION_BLOCKING_TIMEOUT_MS = 10_000;
export const LOCATION_BEST_EFFORT_TIMEOUT_MS = 5_000;

let activePort: DeviceLocationPort = expoDeviceLocationPort;

export function setDeviceLocationPort(port: DeviceLocationPort): void {
  activePort = port;
}

export function requestDeviceLocation(): Promise<DeviceLocationOutcome> {
  return activePort.requestLocation({ timeoutMs: LOCATION_BLOCKING_TIMEOUT_MS });
}

export function requestDeviceLocationBestEffort(): Promise<DeviceLocationOutcome> {
  return activePort.requestLocation({ timeoutMs: LOCATION_BEST_EFFORT_TIMEOUT_MS });
}
