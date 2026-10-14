import type { SessionUser } from '@voyyaa/shared';
import type { PersistedSession } from './secure-storage';

export type SessionStatus = 'hydrating' | 'authenticated' | 'guest';

export interface SessionIdentity {
  status: SessionStatus;
  accessToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
  accessTokenExpiresAt: number | null;
  sessionStartedAt: number | null;
}

export const GUEST_IDENTITY: SessionIdentity = {
  status: 'guest',
  accessToken: null,
  refreshToken: null,
  user: null,
  accessTokenExpiresAt: null,
  sessionStartedAt: null,
};

export interface ReadSessionIdentityDeps {
  readPersistedSession: () => Promise<PersistedSession | null>;
  now: () => number;
}

export interface ClearSessionIdentityDeps {
  clearPersistedSession: () => Promise<void>;
  runClearedHandlers: () => Promise<void>;
  apply: (identity: SessionIdentity) => void;
}

function ignoreFailure(): void {
  return undefined;
}

export function authenticatedIdentity(persisted: PersistedSession, now: number): SessionIdentity {
  return {
    status: 'authenticated',
    accessToken: persisted.accessToken,
    refreshToken: persisted.refreshToken,
    user: persisted.user,
    accessTokenExpiresAt: persisted.accessTokenExpiresAt,
    sessionStartedAt: now,
  };
}

export async function readSessionIdentity(deps: ReadSessionIdentityDeps): Promise<SessionIdentity> {
  try {
    const persisted = await deps.readPersistedSession();
    return persisted === null ? GUEST_IDENTITY : authenticatedIdentity(persisted, deps.now());
  } catch {
    return GUEST_IDENTITY;
  }
}

export async function clearSessionIdentity(deps: ClearSessionIdentityDeps): Promise<void> {
  try {
    await Promise.resolve().then(deps.clearPersistedSession).catch(ignoreFailure);
    await deps.runClearedHandlers();
  } catch {
    return;
  } finally {
    deps.apply(GUEST_IDENTITY);
  }
}
