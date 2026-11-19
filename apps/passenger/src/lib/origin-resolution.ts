import type { DemoSession, Location } from '@voyyaa/shared';
import type { DeviceLocationOutcome } from '@voyyaa/app-runtime';
import type { OriginSource } from '../state/useTripDraftStore';
import { demoReferenceOrigin } from './demo-origin';

export type OriginUnresolvedReason = 'permission_denied' | 'consent_required' | 'unavailable';

export type OriginResolutionOutcome =
  | { status: 'resolved'; origin: Location; source: OriginSource }
  | { status: 'unresolved'; reason: OriginUnresolvedReason; canAskAgain?: boolean };

export const DEVICE_ORIGIN_ADDRESS = 'Tu ubicación actual';

export async function resolveOriginOutcome(
  demo: DemoSession | null,
  requestDeviceLocation: () => Promise<DeviceLocationOutcome>,
): Promise<OriginResolutionOutcome> {
  if (demo !== null) {
    return { status: 'resolved', origin: demoReferenceOrigin(demo), source: 'manual' };
  }
  const outcome = await requestDeviceLocation();
  if (outcome.kind === 'granted') {
    return {
      status: 'resolved',
      origin: { address: DEVICE_ORIGIN_ADDRESS, ...outcome.coordinate },
      source: 'gps',
    };
  }
  if (outcome.kind === 'permission_denied') {
    return { status: 'unresolved', reason: 'permission_denied', canAskAgain: outcome.canAskAgain };
  }
  if (outcome.kind === 'consent_required') {
    return { status: 'unresolved', reason: 'consent_required' };
  }
  return { status: 'unresolved', reason: 'unavailable' };
}
