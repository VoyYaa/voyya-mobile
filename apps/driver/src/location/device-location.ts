import type { Coordinate } from '@voyyaa/shared';

export type DeviceLocationOutcome =
  | { kind: 'granted'; coordinate: Coordinate }
  | { kind: 'permission_denied' }
  | { kind: 'unavailable' };

export interface DeviceLocationPort {
  requestLocation: () => Promise<DeviceLocationOutcome>;
}

export const unavailableDeviceLocationPort: DeviceLocationPort = {
  requestLocation: async () => ({ kind: 'unavailable' }),
};

let activePort: DeviceLocationPort = unavailableDeviceLocationPort;

export function setDeviceLocationPort(port: DeviceLocationPort): void {
  activePort = port;
}

export function requestDeviceLocation(): Promise<DeviceLocationOutcome> {
  return activePort.requestLocation();
}
