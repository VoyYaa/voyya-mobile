import { ZodError } from 'zod';
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
  getEpoch: () => number;
  revoke: (refreshToken: string) => Promise<void>;
}

export type SessionRefresher = ((failedAccessToken?: string | null) => Promise<string | null>) & {
  whenIdle: () => Promise<void>;
};

const DEFINITIVE_REJECTION_STATUSES: readonly number[] = [400, 401, 403];

export function isDefinitiveRefreshRejection(error: unknown): boolean {
  if (error instanceof ZodError) return true;
  return (
    error instanceof ApiError &&
    error.kind === 'http' &&
    error.status !== undefined &&
    DEFINITIVE_REJECTION_STATUSES.includes(error.status)
  );
}

export function createSessionRefresher(deps: SessionRefresherDeps): SessionRefresher {
  let inFlight: Promise<string | null> | null = null;

  const discard = async (tokens: SessionTokens): Promise<null> => {
    await deps.revoke(tokens.refresh_token).catch(() => undefined);
    return null;
  };

  const refreshOnce = async (): Promise<string | null> => {
    const { refreshToken } = deps.getCurrent();
    if (!refreshToken) return null;
    const epoch = deps.getEpoch();
    let tokens: SessionTokens;
    try {
      tokens = await deps.requestRefresh(refreshToken);
    } catch (error) {
      if (!isDefinitiveRefreshRejection(error)) throw error;
      if (deps.getEpoch() !== epoch) return null;
      const current = deps.getCurrent();
      if (current.refreshToken && current.refreshToken !== refreshToken) {
        return current.accessToken;
      }
      await deps.clear();
      return null;
    }
    if (deps.getEpoch() !== epoch) return discard(tokens);
    await deps.saveTokens(tokens);
    if (deps.getEpoch() !== epoch) return discard(tokens);
    return tokens.access_token;
  };

  const refresh = (failedAccessToken?: string | null): Promise<string | null> => {
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

  const whenIdle = async (): Promise<void> => {
    await inFlight?.catch(() => undefined);
  };

  return Object.assign(refresh, { whenIdle });
}
