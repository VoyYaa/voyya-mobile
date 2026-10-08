export const LOCATION_CONSENT_REQUIRED_CODE = 'LOCATION_CONSENT_REQUIRED';
const FORBIDDEN_STATUS = 403;

export function isLocationConsentRequiredError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { status?: unknown; code?: unknown };
  return candidate.status === FORBIDDEN_STATUS && candidate.code === LOCATION_CONSENT_REQUIRED_CODE;
}
