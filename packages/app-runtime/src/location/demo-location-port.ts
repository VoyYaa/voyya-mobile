import type { DemoSession } from '@voyyaa/shared';
import type { DeviceLocationPort } from './device-location-port';
import { createFixedLocationPort } from './fixed-location-port';

export interface DemoLocationPortSync {
  apply: (demoSession: DemoSession | null) => void;
  restore: () => void;
}

export function createDemoLocationPortSync(
  setPort: (port: DeviceLocationPort) => void,
  realPort: DeviceLocationPort,
): DemoLocationPortSync {
  return {
    apply: (demoSession) => {
      setPort(demoSession === null ? realPort : createFixedLocationPort(demoSession.center));
    },
    restore: () => setPort(realPort),
  };
}
