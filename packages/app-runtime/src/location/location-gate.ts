import type { DeviceLocationPort } from './device-location-port';
import { withinDeadline } from './within-deadline';

export function createConsentGatedLocationPort(
  port: DeviceLocationPort,
  isConsentConfirmed: () => Promise<boolean>,
): DeviceLocationPort {
  return {
    requestLocation: async (options) => {
      const consented = await withinDeadline(isConsentConfirmed(), options.timeoutMs, () => null);
      if (consented === null) return { kind: 'unavailable', reason: 'timeout' };
      if (!consented) return { kind: 'consent_required' };
      return port.requestLocation(options);
    },
  };
}
