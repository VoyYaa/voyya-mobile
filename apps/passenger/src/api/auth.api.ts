import {
  AuthError,
  RequestOtpDTO,
  RequestOtpResponse,
  SessionResponse,
  VerifyOtpDTO,
} from '@voyyaa/shared';
import { apiRequest } from '@voyyaa/app-runtime';

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
