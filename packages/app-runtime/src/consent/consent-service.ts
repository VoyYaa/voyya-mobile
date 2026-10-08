import type {
  ConsentPurpose,
  ConsentStatus,
  GrantConsentDTO,
  NoticeVersion,
  RevokeConsentDTO,
} from '@voyyaa/shared';

export interface ConsentStoragePort {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
}

export interface ConsentRemote {
  grant: (dto: GrantConsentDTO) => Promise<ConsentStatus>;
  revoke: (dto: RevokeConsentDTO) => Promise<ConsentStatus>;
  list: () => Promise<ConsentStatus[]>;
}

export interface ConsentServiceDeps {
  remote: ConsentRemote;
  getStorage: () => ConsentStoragePort;
  getUserId: () => number | null;
  currentVersion: NoticeVersion;
  now: () => string;
}

export interface ConsentService {
  isConfirmed: (purpose: ConsentPurpose) => Promise<boolean>;
  grant: (purpose: ConsentPurpose) => Promise<ConsentStatus>;
  revoke: (purpose: ConsentPurpose) => Promise<ConsentStatus>;
  refresh: (purpose: ConsentPurpose) => Promise<ConsentStatus>;
  forget: (purpose: ConsentPurpose) => Promise<void>;
}

const STORAGE_KEY_PREFIX = 'voyya_consent_v2_';

interface ConfirmedFlag {
  version: string;
  confirmedAt: string;
}

function parseConfirmedFlag(raw: string): ConfirmedFlag | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const candidate = parsed as { version?: unknown; confirmedAt?: unknown };
  if (typeof candidate.version !== 'string' || typeof candidate.confirmedAt !== 'string') {
    return null;
  }
  return { version: candidate.version, confirmedAt: candidate.confirmedAt };
}

export function createConsentService(deps: ConsentServiceDeps): ConsentService {
  function storageKey(purpose: ConsentPurpose, userId: number): string {
    return `${STORAGE_KEY_PREFIX}${purpose}_${userId}`;
  }

  async function forget(purpose: ConsentPurpose): Promise<void> {
    const userId = deps.getUserId();
    if (userId === null) return;
    await deps.getStorage().deleteItem(storageKey(purpose, userId));
  }

  async function isConfirmed(purpose: ConsentPurpose): Promise<boolean> {
    const userId = deps.getUserId();
    if (userId === null) return false;
    const raw = await deps.getStorage().getItem(storageKey(purpose, userId));
    const flag = raw ? parseConfirmedFlag(raw) : null;
    return flag !== null && flag.version === deps.currentVersion;
  }

  async function applyStatus(purpose: ConsentPurpose, status: ConsentStatus): Promise<void> {
    const userId = deps.getUserId();
    if (userId === null) return;
    const confirmed =
      status.state === 'granted' &&
      !status.requires_acceptance &&
      status.notice_version === deps.currentVersion;
    if (!confirmed) {
      await deps.getStorage().deleteItem(storageKey(purpose, userId));
      return;
    }
    const flag: ConfirmedFlag = { version: deps.currentVersion, confirmedAt: deps.now() };
    await deps.getStorage().setItem(storageKey(purpose, userId), JSON.stringify(flag));
  }

  async function grant(purpose: ConsentPurpose): Promise<ConsentStatus> {
    const status = await deps.remote.grant({ purpose, notice_version: deps.currentVersion });
    await applyStatus(purpose, status);
    return status;
  }

  async function revoke(purpose: ConsentPurpose): Promise<ConsentStatus> {
    await forget(purpose);
    const status = await deps.remote.revoke({ purpose });
    await applyStatus(purpose, status);
    return status;
  }

  async function refresh(purpose: ConsentPurpose): Promise<ConsentStatus> {
    const statuses = await deps.remote.list();
    const status = statuses.find((entry) => entry.purpose === purpose);
    if (!status) {
      await forget(purpose);
      return {
        purpose,
        state: 'none',
        notice_version: null,
        granted_at: null,
        revoked_at: null,
        current_notice_version: deps.currentVersion,
        requires_acceptance: true,
      };
    }
    await applyStatus(purpose, status);
    return status;
  }

  return { isConfirmed, grant, revoke, refresh, forget };
}
