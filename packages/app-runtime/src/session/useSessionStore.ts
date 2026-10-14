import { create } from 'zustand';
import type { SessionResponse, SessionTokens } from '@voyyaa/shared';
import { configureAuthHandlers } from '../api/http-client';
import { logout, refreshSession } from '../api/session.api';
import {
  clearPersistedSession,
  readPersistedSession,
  saveSession,
  updatePersistedTokens,
} from './secure-storage';
import { runSessionClearedHandlers } from './session-cleanup';
import {
  clearSessionIdentity,
  readSessionIdentity,
  type SessionIdentity,
} from './session-lifecycle';
import { createSessionRefresher } from './session-refresher';

export type { SessionStatus } from './session-lifecycle';

interface SessionState extends SessionIdentity {
  sessionEpoch: number;

  hydrate: () => Promise<void>;
  setSession: (response: SessionResponse) => Promise<void>;
  setTokens: (tokens: SessionTokens) => Promise<void>;
  clearSession: () => Promise<void>;
}

function computeExpiresAt(expiresInSec: number): number {
  return Date.now() + expiresInSec * 1000;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  status: 'hydrating',
  sessionEpoch: 0,
  accessToken: null,
  refreshToken: null,
  user: null,
  accessTokenExpiresAt: null,
  sessionStartedAt: null,

  hydrate: async () => {
    set(await readSessionIdentity({ readPersistedSession, now: Date.now }));
  },

  setSession: async (response) => {
    set({ sessionEpoch: get().sessionEpoch + 1 });
    const accessTokenExpiresAt = computeExpiresAt(response.tokens.expires_in);
    await saveSession({
      accessToken: response.tokens.access_token,
      refreshToken: response.tokens.refresh_token,
      user: response.user,
      accessTokenExpiresAt,
    });
    set({
      status: 'authenticated',
      accessToken: response.tokens.access_token,
      refreshToken: response.tokens.refresh_token,
      user: response.user,
      accessTokenExpiresAt,
      sessionStartedAt: Date.now(),
    });
  },

  setTokens: async (tokens) => {
    const accessTokenExpiresAt = computeExpiresAt(tokens.expires_in);
    await updatePersistedTokens(tokens.access_token, tokens.refresh_token, accessTokenExpiresAt);
    set({
      status: 'authenticated',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresAt,
    });
  },

  clearSession: async () => {
    set({ sessionEpoch: get().sessionEpoch + 1 });
    await clearSessionIdentity({
      clearPersistedSession,
      runClearedHandlers: runSessionClearedHandlers,
      apply: (identity) => set(identity),
    });
  },
}));

const refreshSessionOnce = createSessionRefresher({
  getCurrent: () => {
    const { accessToken, refreshToken } = useSessionStore.getState();
    return { accessToken, refreshToken };
  },
  requestRefresh: (refreshToken) => refreshSession({ refresh_token: refreshToken }),
  saveTokens: (tokens) => useSessionStore.getState().setTokens(tokens),
  clear: () => useSessionStore.getState().clearSession(),
  getEpoch: () => useSessionStore.getState().sessionEpoch,
  revoke: async (refreshToken) => {
    await logout({ refresh_token: refreshToken });
  },
});

export function waitForSessionRefresh(): Promise<void> {
  return refreshSessionOnce.whenIdle();
}

export async function tryRefreshSession(): Promise<string | null> {
  try {
    return await refreshSessionOnce();
  } catch {
    return null;
  }
}

configureAuthHandlers({
  getAccessToken: () => useSessionStore.getState().accessToken,
  refreshAndRetry: refreshSessionOnce,
  onSessionExpired: () => {
    void useSessionStore.getState().clearSession();
  },
});
