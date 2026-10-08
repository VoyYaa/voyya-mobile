import type { DeviceLocationPort } from './device-location-port';

export function createConsentGatedLocationPort(
  port: DeviceLocationPort,
  isConsentConfirmed: () => Promise<boolean>,
): DeviceLocationPort {
  return {
    requestLocation: async (options) => {
      if (!(await isConsentConfirmed())) return { kind: 'consent_required' };
      return port.requestLocation(options);
    },
  };
}
