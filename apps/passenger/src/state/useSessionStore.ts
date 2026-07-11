// =============================================================================
// VoyYa Pasajero — useSessionStore (Zustand)
// -----------------------------------------------------------------------------
// Único store de SESIÓN: tokens + usuario + `status`. A diferencia de
// useTripDraftStore (borrador de UI puro), este SÍ persiste (expo-secure-store)
// porque la sesión debe sobrevivir a relanzar la app — y se lee de forma
// SÍNCRONA (`getState()`) desde fuera de React (http-client.ts, vía los
// handlers inyectados abajo), algo que TanStack Query no ofrece igual de simple.
//
// Este módulo, al importarse, CONFIGURA los handlers de auth de http-client.ts
// (inversión de dependencia: http-client no conoce Zustand ni este store, solo
// expone `configureAuthHandlers`). `app/_layout.tsx` importa este store para
// llamar a `hydrate()` al arrancar, lo que garantiza que el cableado ya esté
// listo antes de la primera pantalla/llamada real a la API.
// =============================================================================

import { create } from 'zustand';
import type { RespuestaSesion, SesionTokens, UsuarioSesion } from '@voyya/shared';
import { configureAuthHandlers } from '../api/http-client';
import { refrescarSesion } from '../api/auth.api';
import {
  actualizarTokensPersistidos,
  borrarSesionPersistida,
  guardarSesion,
  leerSesionPersistida,
} from '../lib/secure-storage';

export type SessionStatus = 'hydrating' | 'authenticated' | 'guest';

interface SessionState {
  status: SessionStatus;
  accessToken: string | null;
  refreshToken: string | null;
  usuario: UsuarioSesion | null;
  /** epoch ms — para el refresh proactivo (~1 min antes, D-A04). */
  accessTokenExpiresAt: number | null;

  /** Lee expo-secure-store una vez al arrancar la app (ver app/_layout.tsx). */
  hydrate: () => Promise<void>;
  /** Login exitoso (OTP): guarda tokens + usuario. */
  setSession: (respuesta: RespuestaSesion) => Promise<void>;
  /** Rotación de `/auth/refresh`: reemplaza AMBOS tokens, conserva `usuario`. */
  setTokens: (tokens: SesionTokens) => Promise<void>;
  /** Logout (idempotente, D-A05): limpia el estado local sin depender del servidor. */
  clearSession: () => Promise<void>;
}

function calcularExpiraEn(expiresInSeg: number): number {
  return Date.now() + expiresInSeg * 1000;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'hydrating',
  accessToken: null,
  refreshToken: null,
  usuario: null,
  accessTokenExpiresAt: null,

  hydrate: async () => {
    const persisted = await leerSesionPersistida();
    if (!persisted) {
      set({ status: 'guest' });
      return;
    }
    set({
      status: 'authenticated',
      accessToken: persisted.accessToken,
      refreshToken: persisted.refreshToken,
      usuario: persisted.usuario,
      accessTokenExpiresAt: persisted.accessTokenExpiresAt,
    });
  },

  setSession: async (respuesta) => {
    const accessTokenExpiresAt = calcularExpiraEn(respuesta.tokens.expires_in);
    await guardarSesion({
      accessToken: respuesta.tokens.access_token,
      refreshToken: respuesta.tokens.refresh_token,
      usuario: respuesta.usuario,
      accessTokenExpiresAt,
    });
    set({
      status: 'authenticated',
      accessToken: respuesta.tokens.access_token,
      refreshToken: respuesta.tokens.refresh_token,
      usuario: respuesta.usuario,
      accessTokenExpiresAt,
    });
  },

  setTokens: async (tokens) => {
    const accessTokenExpiresAt = calcularExpiraEn(tokens.expires_in);
    await actualizarTokensPersistidos(tokens.access_token, tokens.refresh_token, accessTokenExpiresAt);
    set({
      status: 'authenticated',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresAt,
    });
  },

  clearSession: async () => {
    await borrarSesionPersistida();
    set({
      status: 'guest',
      accessToken: null,
      refreshToken: null,
      usuario: null,
      accessTokenExpiresAt: null,
    });
  },
}));

// -----------------------------------------------------------------------------
// Cableado del interceptor de refresh (D-A04) — ver http-client.ts.
// -----------------------------------------------------------------------------

/** Intenta refrescar la sesión una vez. `null` si no había refresh token o si
 *  el refresh falló (en ambos casos ya deja la sesión limpia). Única fuente de
 *  esta lógica: la usan tanto el interceptor 401 de http-client.ts como el
 *  refresh PROACTIVO de hooks/useProactiveRefresh.ts. */
export async function intentarRefrescarSesion(): Promise<string | null> {
  const { refreshToken } = useSessionStore.getState();
  if (!refreshToken) return null;
  try {
    const nuevosTokens = await refrescarSesion({ refresh_token: refreshToken });
    await useSessionStore.getState().setTokens(nuevosTokens);
    return nuevosTokens.access_token;
  } catch {
    await useSessionStore.getState().clearSession();
    return null;
  }
}

configureAuthHandlers({
  getAccessToken: () => useSessionStore.getState().accessToken,
  refreshAndRetry: intentarRefrescarSesion,
  onSessionExpired: () => {
    void useSessionStore.getState().clearSession();
  },
});
