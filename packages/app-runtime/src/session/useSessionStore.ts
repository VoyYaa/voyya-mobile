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
    set({
      status: 'guest',
      accessToken: null,
      refreshToken: null,
      user: null,
      accessTokenExpiresAt: null,
    });
  },
}));

export async function tryRefreshSession(): Promise<string | null> {
  const { refreshToken } = useSessionStore.getState();
  if (!refreshToken) return null;
  try {
    const newTokens = await refreshSession({ refresh_token: refreshToken });
    await useSessionStore.getState().setTokens(newTokens);
    return newTokens.access_token;
  } catch {
    await useSessionStore.getState().clearSession();
    return null;
  }
}

configureAuthHandlers({
  getAccessToken: () => useSessionStore.getState().accessToken,
  refreshAndRetry: tryRefreshSession,
  onSessionExpired: () => {
    void useSessionStore.getState().clearSession();
  },
});
