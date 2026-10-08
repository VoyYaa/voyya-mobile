import type { CompanyRef } from '@voyyaa/shared';

export type NoDriverVariant =
  { kind: 'single' } | { kind: 'company'; company: CompanyRef } | { kind: 'any' };

export interface NoDriverContext {
  requestedCompany: CompanyRef | null;
  selectionRequired: boolean | null;
}

export function decideNoDriverVariant(context: NoDriverContext): NoDriverVariant {
  const { requestedCompany, selectionRequired } = context;
  if (requestedCompany !== null && selectionRequired !== false) {
    return { kind: 'company', company: requestedCompany };
  }
  if (requestedCompany === null && selectionRequired === true) return { kind: 'any' };
  return { kind: 'single' };
}

export type SearchRetryKind = 'same' | 'any';

export function retryRequestedCompanyId(
  kind: SearchRetryKind,
  requestedCompany: CompanyRef | null,
): number | undefined {
  if (kind === 'any') return undefined;
  return requestedCompany?.company_id;
}

export function shouldReviewFare(
  kind: SearchRetryKind,
  previousTotal: number | null,
  freshTotal: number,
): boolean {
  return kind === 'any' && previousTotal !== null && previousTotal !== freshTotal;
}
