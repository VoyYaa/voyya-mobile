import { ConsentListResponse, ConsentRecord, GrantConsentDTO } from '@voyyaa/shared';
import { apiRequest } from '../api/http-client';

export function grantConsent(dto: GrantConsentDTO): Promise<ConsentRecord> {
  const body = GrantConsentDTO.parse(dto);
  return apiRequest({ method: 'POST', path: '/consents', body }, ConsentRecord);
}

export function listConsents(): Promise<ConsentListResponse> {
  return apiRequest({ method: 'GET', path: '/consents' }, ConsentListResponse);
}
