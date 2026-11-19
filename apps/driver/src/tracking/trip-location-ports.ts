import { ApiError, LOCATION_REQUIRED_ACCURACY_M, domainErrorCode } from '@voyyaa/app-runtime';
import { useLocationIssueStore } from '../state/useLocationIssueStore';
import type { FailureInfo } from './report-batch';

const CONSENT_REQUIRED = 'LOCATION_CONSENT_REQUIRED';

export const MAX_READING_ACCURACY_M = LOCATION_REQUIRED_ACCURACY_M;

export function describeFailure(error: unknown): FailureInfo {
  const status = error instanceof ApiError ? error.status : undefined;
  return { status, code: domainErrorCode(error) };
}

export function onRejectedForGood({ code }: FailureInfo): void {
  if (code === CONSENT_REQUIRED) useLocationIssueStore.getState().setIssue('consent_required');
}
