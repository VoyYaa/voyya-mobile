import * as SecureStore from 'expo-secure-store';
import { SessionUser } from '@voyyaa/shared';

const KEYS = {
  accessToken: 'voyya_access_token',
  refreshToken: 'voyya_refresh_token',
  user: 'voyya_user',
  accessTokenExpiresAt: 'voyya_access_token_expires_at',
} as const;

export interface PersistedSession {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
  accessTokenExpiresAt: number;
}

export async function readPersistedSession(): Promise<PersistedSession | null> {
  const [accessToken, refreshToken, userJson, expiresAtRaw] = await Promise.all([
    SecureStore.getItemAsync(KEYS.accessToken),
    SecureStore.getItemAsync(KEYS.refreshToken),
    SecureStore.getItemAsync(KEYS.user),
    SecureStore.getItemAsync(KEYS.accessTokenExpiresAt),
  ]);
  if (!accessToken || !refreshToken || !userJson || !expiresAtRaw) return null;

  const parsedUser = SessionUser.safeParse(JSON.parse(userJson) as unknown);
  const accessTokenExpiresAt = Number(expiresAtRaw);
  if (!parsedUser.success || !Number.isFinite(accessTokenExpiresAt)) return null;

  return { accessToken, refreshToken, user: parsedUser.data, accessTokenExpiresAt };
}

export async function saveSession(session: PersistedSession): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.accessToken, session.accessToken),
    SecureStore.setItemAsync(KEYS.refreshToken, session.refreshToken),
    SecureStore.setItemAsync(KEYS.user, JSON.stringify(session.user)),
    SecureStore.setItemAsync(KEYS.accessTokenExpiresAt, String(session.accessTokenExpiresAt)),
  ]);
}

export async function updatePersistedTokens(
  accessToken: string,
  refreshToken: string,
  accessTokenExpiresAt: number,
): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.accessToken, accessToken),
    SecureStore.setItemAsync(KEYS.refreshToken, refreshToken),
    SecureStore.setItemAsync(KEYS.accessTokenExpiresAt, String(accessTokenExpiresAt)),
  ]);
}

export async function clearPersistedSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.accessToken),
    SecureStore.deleteItemAsync(KEYS.refreshToken),
    SecureStore.deleteItemAsync(KEYS.user),
    SecureStore.deleteItemAsync(KEYS.accessTokenExpiresAt),
  ]);
}
