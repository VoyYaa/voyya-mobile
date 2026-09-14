import { AuthError, LogoutDTO, LogoutResponse, RefreshDTO, RefreshResponse } from '@voyyaa/shared';
import { apiRequest } from './http-client';

export function refreshSession(dto: RefreshDTO): Promise<RefreshResponse> {
  const body = RefreshDTO.parse(dto);
  return apiRequest(
    { method: 'POST', path: '/auth/refresh', body, skipAuth: true },
    RefreshResponse,
    AuthError,
  );
}

export function logout(dto: LogoutDTO): Promise<LogoutResponse> {
  const body = LogoutDTO.parse(dto);
  return apiRequest(
    { method: 'POST', path: '/auth/logout', body, skipAuth: true },
    LogoutResponse,
    AuthError,
  );
}
