// =============================================================================
// VoyYa Pasajero — API del dominio AUTH
// -----------------------------------------------------------------------------
// Funciones finas 1:1 con el contrato de `@voyya/shared/contracts/auth`. Mismo
// patrón que trips.api.ts: cada DTO se valida con `.parse()` antes de enviarlo
// (defensa en profundidad) y la respuesta con su esquema. Los 4 endpoints que
// consume esta app son PÚBLICOS (HU-AUTH-01/04): `skipAuth: true` — ninguno
// adjunta el access token vigente ni dispara el reintento de refresh en 401
// (evita recursión en el propio /auth/refresh).
// =============================================================================

import {
  ErrorAuth,
  LogoutDTO,
  RefreshDTO,
  RespuestaLogout,
  RespuestaRefresh,
  RespuestaSesion,
  SolicitarOtpDTO,
  SolicitarOtpRespuesta,
  VerificarOtpDTO,
} from '@voyya/shared';
import { apiRequest } from './http-client';

export function solicitarOtp(dto: SolicitarOtpDTO): Promise<SolicitarOtpRespuesta> {
  const body = SolicitarOtpDTO.parse(dto);
  return apiRequest(
    { method: 'POST', path: '/auth/otp/solicitar', body, skipAuth: true },
    SolicitarOtpRespuesta,
    ErrorAuth,
  );
}

export function verificarOtp(dto: VerificarOtpDTO): Promise<RespuestaSesion> {
  const body = VerificarOtpDTO.parse(dto);
  return apiRequest(
    { method: 'POST', path: '/auth/otp/verificar', body, skipAuth: true },
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
