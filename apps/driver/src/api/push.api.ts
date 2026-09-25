import { z } from 'zod';
import { RegisterPushTokenDTO, RevokePushTokenDTO } from '@voyyaa/shared';
import { apiRequest } from '@voyyaa/app-runtime';

const NoContent = z.unknown();

export async function registerPushToken(dto: RegisterPushTokenDTO): Promise<void> {
  const body = RegisterPushTokenDTO.parse(dto);
  await apiRequest({ method: 'POST', path: '/push-tokens', body }, NoContent);
}

export async function revokePushToken(dto: RevokePushTokenDTO): Promise<void> {
  const body = RevokePushTokenDTO.parse(dto);
  await apiRequest({ method: 'POST', path: '/push-tokens/revoke', body }, NoContent);
}
