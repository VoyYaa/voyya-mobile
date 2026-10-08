import {
  ConsentError,
  ConsentStatus,
  ConsentStatusListResponse,
  GrantConsentDTO,
  RevokeConsentDTO,
} from '@voyyaa/shared';
import { apiRequest } from '../api/http-client';

export function grantConsent(dto: GrantConsentDTO): Promise<ConsentStatus> {
  const body = GrantConsentDTO.parse(dto);
  return apiRequest({ method: 'POST', path: '/consents', body }, ConsentStatus, ConsentError);
}

export function revokeConsent(dto: RevokeConsentDTO): Promise<ConsentStatus> {
  const body = RevokeConsentDTO.parse(dto);
  return apiRequest(
    { method: 'POST', path: '/consents/revoke', body },
    ConsentStatus,
    ConsentError,
  );
}

export function listConsents(): Promise<ConsentStatusListResponse> {
  return apiRequest({ method: 'GET', path: '/consents' }, ConsentStatusListResponse, ConsentError);
}
