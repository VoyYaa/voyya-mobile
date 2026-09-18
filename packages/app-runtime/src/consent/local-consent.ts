import type { ConsentPurpose, NoticeVersion } from '@voyyaa/shared';
import { getSecureStoragePort } from '../session/secure-storage-port';
import { grantConsent } from './consent.api';

const CONSENT_STORAGE_KEY_PREFIX = 'voyya_consent_';

export interface LocalConsentFlag {
  version: NoticeVersion;
  syncedAt: string | null;
}

function storageKey(purpose: ConsentPurpose): string {
  return `${CONSENT_STORAGE_KEY_PREFIX}${purpose}`;
}

function parseLocalConsentFlag(raw: string): LocalConsentFlag | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const candidate = parsed as { version?: unknown; syncedAt?: unknown };
  if (typeof candidate.version !== 'string') return null;
  const syncedAt = typeof candidate.syncedAt === 'string' ? candidate.syncedAt : null;
  return { version: candidate.version, syncedAt };
}

export async function readLocalConsent(purpose: ConsentPurpose): Promise<LocalConsentFlag | null> {
  const raw = await getSecureStoragePort().getItem(storageKey(purpose));
  return raw ? parseLocalConsentFlag(raw) : null;
}

export async function hasSeenLocalConsent(
  purpose: ConsentPurpose,
  version: NoticeVersion,
): Promise<boolean> {
  const flag = await readLocalConsent(purpose);
  return flag !== null && flag.version === version;
}

async function writeLocalConsentFlag(
  purpose: ConsentPurpose,
  version: NoticeVersion,
  syncedAt: string | null,
): Promise<void> {
  await getSecureStoragePort().setItem(storageKey(purpose), JSON.stringify({ version, syncedAt }));
}

async function trySyncConsent(purpose: ConsentPurpose, version: NoticeVersion): Promise<void> {
  try {
    await grantConsent({ purpose, notice_version: version });
    await writeLocalConsentFlag(purpose, version, new Date().toISOString());
  } catch {
    await writeLocalConsentFlag(purpose, version, null);
  }
}

export async function confirmConsent(
  purpose: ConsentPurpose,
  version: NoticeVersion,
): Promise<void> {
  await writeLocalConsentFlag(purpose, version, null);
  await trySyncConsent(purpose, version);
}

export async function retryPendingConsentSync(
  purpose: ConsentPurpose,
  version: NoticeVersion,
): Promise<void> {
  const flag = await readLocalConsent(purpose);
  if (!flag || flag.version !== version || flag.syncedAt !== null) return;
  await trySyncConsent(purpose, version);
}
