import { LOCATION_NOTICE_VERSION, type ConsentStatus } from '@voyyaa/shared';
import { useSessionStore } from '../session/useSessionStore';
import { getSecureStoragePort } from '../session/secure-storage-port';
import { grantConsent, listConsents, revokeConsent } from './consent.api';
import { createConsentService } from './consent-service';
import { isLocationConsentRequiredError } from './consent-errors';

const LOCATION_PURPOSE = 'location';

const locationConsent = createConsentService({
  remote: { grant: grantConsent, revoke: revokeConsent, list: listConsents },
  getStorage: getSecureStoragePort,
  getUserId: () => useSessionStore.getState().user?.user_id ?? null,
  currentVersion: LOCATION_NOTICE_VERSION,
  now: () => new Date().toISOString(),
});

export function isLocationConsentConfirmed(): Promise<boolean> {
  return locationConsent.isConfirmed(LOCATION_PURPOSE);
}

export function grantLocationConsent(): Promise<ConsentStatus> {
  return locationConsent.grant(LOCATION_PURPOSE);
}

export function revokeLocationConsent(): Promise<ConsentStatus> {
  return locationConsent.revoke(LOCATION_PURPOSE);
}

export function refreshLocationConsent(): Promise<ConsentStatus> {
  return locationConsent.refresh(LOCATION_PURPOSE);
}

export function forgetLocationConsent(): Promise<void> {
  return locationConsent.forget(LOCATION_PURPOSE);
}

export async function handleLocationConsentRequired(error: unknown): Promise<boolean> {
  if (!isLocationConsentRequiredError(error)) return false;
  await forgetLocationConsent();
  return true;
}

export async function resolveLocationConsentConfirmed(): Promise<boolean> {
  if (await isLocationConsentConfirmed()) return true;
  try {
    await refreshLocationConsent();
  } catch {
    return false;
  }
  return isLocationConsentConfirmed();
}
