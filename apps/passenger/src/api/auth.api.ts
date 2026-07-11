import {
  AuthError,
  LogoutDTO,
  LogoutResponse,
  RefreshDTO,
  RefreshResponse,
  RequestOtpDTO,
  RequestOtpResponse,
  SessionResponse,
  VerifyOtpDTO,
} from '@voyyaa/shared';
import { apiRequest } from './http-client';

export function requestOtp(dto: RequestOtpDTO): Promise<RequestOtpResponse> {
  const body = RequestOtpDTO.parse(dto);
  return apiRequest(
    { method: 'POST', path: '/auth/otp/request', body, skipAuth: true },
    RequestOtpResponse,
    AuthError,
  );
}

export function verifyOtp(dto: VerifyOtpDTO): Promise<SessionResponse> {
  const body = VerifyOtpDTO.parse(dto);
  return apiRequest(
    { method: 'POST', path: '/auth/otp/verify', body, skipAuth: true },
    SessionResponse,
    AuthError,
  );
}

export function refreshSession(dto: RefreshDTO): Promise<RefreshResponse> {
  const body = RefreshDTO.parse(dto);
  return apiRequest({ method: 'POST', path: '/auth/refresh', body, skipAuth: true }, RefreshResponse, AuthError);
}

export function logout(dto: LogoutDTO): Promise<LogoutResponse> {
  const body = LogoutDTO.parse(dto);
  return apiRequest({ method: 'POST', path: '/auth/logout', body, skipAuth: true }, LogoutResponse, AuthError);
}
