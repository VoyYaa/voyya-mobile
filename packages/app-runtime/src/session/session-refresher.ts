import type { SessionTokens } from '@voyyaa/shared';
import { ApiError } from '../api/errors';

export interface SessionSnapshot {
  accessToken: string | null;
  refreshToken: string | null;
}

export interface SessionRefresherDeps {
  getCurrent: () => SessionSnapshot;
  requestRefresh: (refreshToken: string) => Promise<SessionTokens>;
  saveTokens: (tokens: SessionTokens) => Promise<void>;
  clear: () => Promise<void>;
}

export type SessionRefresher = (failedAccessToken?: string | null) => Promise<string | null>;

const DEFINITIVE_REJECTION_STATUSES: readonly number[] = [401, 403];

export function isDefinitiveRefreshRejection(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.kind === 'http' &&
    error.status !== undefined &&
    DEFINITIVE_REJECTION_STATUSES.includes(error.status)
  );
}

export function createSessionRefresher(deps: SessionRefresherDeps): SessionRefresher {
  let inFlight: Promise<string | null> | null = null;

  const refreshOnce = async (): Promise<string | null> => {
    const { refreshToken } = deps.getCurrent();
    if (!refreshToken) return null;
    try {
      const tokens = await deps.requestRefresh(refreshToken);
      await deps.saveTokens(tokens);
      return tokens.access_token;
    } catch (error) {
      if (!isDefinitiveRefreshRejection(error)) throw error;
      const current = deps.getCurrent();
      if (current.refreshToken && current.refreshToken !== refreshToken) {
        return current.accessToken;
      }
      await deps.clear();
      return null;
    }
  };

  return (failedAccessToken) => {
    if (inFlight) return inFlight;
    const { accessToken } = deps.getCurrent();
    if (failedAccessToken && accessToken && accessToken !== failedAccessToken) {
      return Promise.resolve(accessToken);
    }
    inFlight = refreshOnce().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}
