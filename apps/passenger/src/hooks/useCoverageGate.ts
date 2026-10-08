import { isNetworkError } from '@voyyaa/app-runtime';
import { usePickupServiceOptions } from './useServiceOptions';

export type CoverageGateStatus = 'idle' | 'checking' | 'within' | 'outside' | 'error';

export interface CoverageGate {
  status: CoverageGateStatus;
  retry: () => void;
}

export function useCoverageGate(): CoverageGate {
  const { query } = usePickupServiceOptions();
  const retry = (): void => {
    void query.refetch();
  };

  if (query.fetchStatus === 'idle' && query.data === undefined && !query.isError) {
    return { status: 'idle', retry };
  }
  if (query.data) {
    return { status: query.data.municipality === null ? 'outside' : 'within', retry };
  }
  if (query.isError) {
    return { status: isNetworkError(query.error) ? 'within' : 'error', retry };
  }
  return { status: 'checking', retry };
}
