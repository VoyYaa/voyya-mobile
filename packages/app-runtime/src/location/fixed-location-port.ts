import type { Coordinate } from '@voyyaa/shared';
import type { DeviceLocationPort } from './device-location-port';

export function createFixedLocationPort(center: Coordinate): DeviceLocationPort {
  const fixed = { lat: center.lat, lng: center.lng };
  return {
    requestLocation: async () => ({ kind: 'granted', coordinate: { ...fixed } }),
  };
}
