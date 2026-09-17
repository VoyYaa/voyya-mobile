import { SessionUser } from '@voyyaa/shared';
import { getSecureStoragePort } from './secure-storage-port';

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
  const storage = getSecureStoragePort();
  const [accessToken, refreshToken, userJson, expiresAtRaw] = await Promise.all([
    storage.getItem(KEYS.accessToken),
    storage.getItem(KEYS.refreshToken),
    storage.getItem(KEYS.user),
    storage.getItem(KEYS.accessTokenExpiresAt),
  ]);
  if (!accessToken || !refreshToken || !userJson || !expiresAtRaw) return null;

  const parsedUser = SessionUser.safeParse(JSON.parse(userJson) as unknown);
  const accessTokenExpiresAt = Number(expiresAtRaw);
  if (!parsedUser.success || !Number.isFinite(accessTokenExpiresAt)) return null;

  return { accessToken, refreshToken, user: parsedUser.data, accessTokenExpiresAt };
}

export async function saveSession(session: PersistedSession): Promise<void> {
  const storage = getSecureStoragePort();
  await Promise.all([
    storage.setItem(KEYS.accessToken, session.accessToken),
    storage.setItem(KEYS.refreshToken, session.refreshToken),
    storage.setItem(KEYS.user, JSON.stringify(session.user)),
    storage.setItem(KEYS.accessTokenExpiresAt, String(session.accessTokenExpiresAt)),
  ]);
}

export async function updatePersistedTokens(
  accessToken: string,
  refreshToken: string,
  accessTokenExpiresAt: number,
): Promise<void> {
  const storage = getSecureStoragePort();
  await Promise.all([
    storage.setItem(KEYS.accessToken, accessToken),
    storage.setItem(KEYS.refreshToken, refreshToken),
    storage.setItem(KEYS.accessTokenExpiresAt, String(accessTokenExpiresAt)),
  ]);
}

export async function clearPersistedSession(): Promise<void> {
  const storage = getSecureStoragePort();
  await Promise.all([
    storage.deleteItem(KEYS.accessToken),
    storage.deleteItem(KEYS.refreshToken),
    storage.deleteItem(KEYS.user),
    storage.deleteItem(KEYS.accessTokenExpiresAt),
  ]);
}
