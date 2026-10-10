import { create } from 'zustand';
import type { SessionResponse, SessionTokens, SessionUser } from '@voyyaa/shared';
import { configureAuthHandlers } from '../api/http-client';
import { refreshSession } from '../api/session.api';
import {
  clearPersistedSession,
  readPersistedSession,
  saveSession,
  updatePersistedTokens,
} from './secure-storage';
import { runSessionClearedHandlers } from './session-cleanup';
import { createSessionRefresher } from './session-refresher';

export type SessionStatus = 'hydrating' | 'authenticated' | 'guest';

interface SessionState {
  status: SessionStatus;
  accessToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
  accessTokenExpiresAt: number | null;

  hydrate: () => Promise<void>;
  setSession: (response: SessionResponse) => Promise<void>;
  setTokens: (tokens: SessionTokens) => Promise<void>;
  clearSession: () => Promise<void>;
}

function computeExpiresAt(expiresInSec: number): number {
  return Date.now() + expiresInSec * 1000;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'hydrating',
  accessToken: null,
  refreshToken: null,
  user: null,
  accessTokenExpiresAt: null,

  hydrate: async () => {
    const persisted = await readPersistedSession();
    if (!persisted) {
      set({ status: 'guest' });
      return;
    }
    set({
      status: 'authenticated',
      accessToken: persisted.accessToken,
      refreshToken: persisted.refreshToken,
      user: persisted.user,
      accessTokenExpiresAt: persisted.accessTokenExpiresAt,
    });
  },

  setSession: async (response) => {
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
    await clearPersistedSession();
    await runSessionClearedHandlers();
    set({
      status: 'guest',
      accessToken: null,
      refreshToken: null,
      user: null,
      accessTokenExpiresAt: null,
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
});

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
