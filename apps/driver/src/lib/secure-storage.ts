// =============================================================================
// VoyYa Conductor — Almacén seguro de sesión (expo-secure-store)
// -----------------------------------------------------------------------------
// Mismo patrón que apps/passenger/src/lib/secure-storage.ts (DRY de PATRÓN, no
// de código entre apps — mismo criterio ya establecido para api/errors.ts /
// api/http-client.ts: cada app Expo es un deployable independiente). Envoltorio
// fino sobre expo-secure-store (Keychain/Keystore nativo — NUNCA AsyncStorage
// para tokens). `usuario` se persiste ADEMÁS de los tokens porque el contrato
// de @voyya/shared no expone un `GET /auth/me` (decisiones-construccion-
// autenticacion.md D-A04).
// =============================================================================

import * as SecureStore from 'expo-secure-store';
import { UsuarioSesion } from '@voyya/shared';

const KEYS = {
  accessToken: 'voyya_access_token',
  refreshToken: 'voyya_refresh_token',
  usuario: 'voyya_usuario',
  accessTokenExpiresAt: 'voyya_access_token_expires_at',
} as const;

export interface PersistedSession {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioSesion;
  /** epoch ms — permite reprogramar el refresh proactivo tras relanzar la app. */
  accessTokenExpiresAt: number;
}

export async function leerSesionPersistida(): Promise<PersistedSession | null> {
  const [accessToken, refreshToken, usuarioJson, expiresAtRaw] = await Promise.all([
    SecureStore.getItemAsync(KEYS.accessToken),
    SecureStore.getItemAsync(KEYS.refreshToken),
    SecureStore.getItemAsync(KEYS.usuario),
    SecureStore.getItemAsync(KEYS.accessTokenExpiresAt),
  ]);
  if (!accessToken || !refreshToken || !usuarioJson || !expiresAtRaw) return null;

  const parsedUsuario = UsuarioSesion.safeParse(JSON.parse(usuarioJson) as unknown);
  const accessTokenExpiresAt = Number(expiresAtRaw);
  if (!parsedUsuario.success || !Number.isFinite(accessTokenExpiresAt)) return null;

  return { accessToken, refreshToken, usuario: parsedUsuario.data, accessTokenExpiresAt };
}

/** Login exitoso: guarda las 4 claves completas. */
export async function guardarSesion(sesion: PersistedSession): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.accessToken, sesion.accessToken),
    SecureStore.setItemAsync(KEYS.refreshToken, sesion.refreshToken),
    SecureStore.setItemAsync(KEYS.usuario, JSON.stringify(sesion.usuario)),
    SecureStore.setItemAsync(KEYS.accessTokenExpiresAt, String(sesion.accessTokenExpiresAt)),
  ]);
}

/** Rotación de `/auth/refresh`: solo tokens — conserva el `usuario` ya guardado. */
export async function actualizarTokensPersistidos(
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

/** Logout (idempotente, D-A05): borra sin importar si alguna clave ya no existía. */
export async function borrarSesionPersistida(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.accessToken),
    SecureStore.deleteItemAsync(KEYS.refreshToken),
    SecureStore.deleteItemAsync(KEYS.usuario),
    SecureStore.deleteItemAsync(KEYS.accessTokenExpiresAt),
  ]);
}
