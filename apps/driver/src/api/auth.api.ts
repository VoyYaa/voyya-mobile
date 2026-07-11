// =============================================================================
// VoyYa Conductor — API del dominio AUTH
// -----------------------------------------------------------------------------
// Funciones finas 1:1 con el contrato de `@voyya/shared/contracts/auth`. Mismo
// patrón que assignment.api.ts / apps/passenger/src/api/auth.api.ts. Los 3
// endpoints que consume esta app son PÚBLICOS (HU-AUTH-02/04): `skipAuth: true`
// — ninguno adjunta el access token vigente ni dispara el reintento de refresh
// en 401 (evita recursión en el propio /auth/refresh).
// =============================================================================

import {
  ErrorAuth,
  LoginConductorDTO,
  LogoutDTO,
  RefreshDTO,
  RespuestaLogout,
  RespuestaRefresh,
  RespuestaSesion,
} from '@voyya/shared';
import { apiRequest } from './http-client';

export function loginConductor(dto: LoginConductorDTO): Promise<RespuestaSesion> {
  const body = LoginConductorDTO.parse(dto);
  return apiRequest(
    { method: 'POST', path: '/auth/conductor/login', body, skipAuth: true },
    RespuestaSesion,
    ErrorAuth,
  );
}

export function refrescarSesion(dto: RefreshDTO): Promise<RespuestaRefresh> {
  const body = RefreshDTO.parse(dto);
  return apiRequest({ method: 'POST', path: '/auth/refresh', body, skipAuth: true }, RespuestaRefresh, ErrorAuth);
}

export function cerrarSesion(dto: LogoutDTO): Promise<RespuestaLogout> {
  const body = LogoutDTO.parse(dto);
  return apiRequest({ method: 'POST', path: '/auth/logout', body, skipAuth: true }, RespuestaLogout, ErrorAuth);
}
