import { z } from 'zod';
import { ChangeDriverPinDTO, DriverLoginDTO, SessionResponse, AuthError } from '@voyyaa/shared';
import { apiRequest } from '@voyyaa/app-runtime';

export function driverLogin(dto: DriverLoginDTO): Promise<SessionResponse> {
  const body = DriverLoginDTO.parse(dto);
  return apiRequest(
    { method: 'POST', path: '/auth/driver/login', body, skipAuth: true },
    SessionResponse,
    AuthError,
  );
}

const ChangePinErrorBody = z.object({
  code: z.string(),
  message: z.string(),
  retry_in_sec: z.number().int().positive().optional(),
});

export function changeDriverPin(dto: ChangeDriverPinDTO): Promise<SessionResponse> {
  const body = ChangeDriverPinDTO.parse(dto);
  return apiRequest(
    { method: 'POST', path: '/auth/driver/pin', body, skipRefreshOn401: true },
    SessionResponse,
    ChangePinErrorBody,
  );
}
