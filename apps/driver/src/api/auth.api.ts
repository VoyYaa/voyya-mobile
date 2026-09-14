import { AuthError, DriverLoginDTO, SessionResponse } from '@voyyaa/shared';
import { apiRequest } from '@voyyaa/app-runtime';

export function driverLogin(dto: DriverLoginDTO): Promise<SessionResponse> {
  const body = DriverLoginDTO.parse(dto);
  return apiRequest(
    { method: 'POST', path: '/auth/driver/login', body, skipAuth: true },
    SessionResponse,
    AuthError,
  );
}
