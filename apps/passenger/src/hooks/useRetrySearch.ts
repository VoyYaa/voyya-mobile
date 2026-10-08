import { useRef } from 'react';
import { useRouter } from 'expo-router';
import type { CompanyRef } from '@voyyaa/shared';
import { domainErrorCode } from '@voyyaa/app-runtime';
import { FARE_CHANGED_PARAM } from '../constants/route-params';
import { ANY_COMPANY } from '../lib/company-selection';
import {
  retryRequestedCompanyId,
  shouldReviewFare,
  type SearchRetryKind,
} from '../lib/no-driver-decision';
import { useTripDraftStore } from '../state/useTripDraftStore';
import { useActiveTripCache } from './useActiveTrip';
import { useCreateTripRequest } from './useCreateTripRequest';
import { usePickupServiceOptions } from './useServiceOptions';
import { useQuoteFare } from './useQuoteFare';

export interface RetrySearchContext {
  previousTotal: number | null;
  requestedCompany: CompanyRef | null;
}

export interface RetrySearch {
  run: (kind: SearchRetryKind) => void;
  repeatLast: () => void;
  pending: boolean;
  failed: boolean;
}

export function useRetrySearch(context: RetrySearchContext): RetrySearch {
  const router = useRouter();
  const lastKind = useRef<SearchRetryKind>('same');
  const origin = useTripDraftStore((s) => s.origin);
  const destination = useTripDraftStore((s) => s.destination);
  const serviceType = useTripDraftStore((s) => s.serviceType);
  const setQuote = useTripDraftStore((s) => s.setQuote);
  const setCompanyPreference = useTripDraftStore((s) => s.setCompanyPreference);
  const markCompanyUnavailable = useTripDraftStore((s) => s.markCompanyUnavailable);
  const { municipalityId } = usePickupServiceOptions();
  const activeTripCache = useActiveTripCache();
  const quoteFare = useQuoteFare();
  const createTripRequest = useCreateTripRequest();

  const run = (kind: SearchRetryKind): void => {
    if (!origin || !destination || municipalityId === null) {
      router.replace('/');
      return;
    }
    lastKind.current = kind;
    createTripRequest.reset();
    quoteFare.mutate(
      { origin, destination, municipality_id: municipalityId, service_type: serviceType },
      {
        onSuccess: (freshQuote) => {
          if (shouldReviewFare(kind, context.previousTotal, freshQuote.fare.total)) {
            setQuote(freshQuote);
            setCompanyPreference(ANY_COMPANY);
            router.replace({ pathname: '/confirm', params: { [FARE_CHANGED_PARAM]: '1' } });
            return;
          }
          createTripRequest.mutate(
            {
              origin,
              destination,
              municipality_id: municipalityId,
              service_type: serviceType,
              payment_method: 'cash',
              quote_token: freshQuote.quote_token,
              requested_company_id: retryRequestedCompanyId(kind, context.requestedCompany),
            },
            {
              onSuccess: (newTripRequest) => {
                void activeTripCache.refresh().catch(() => undefined);
                router.replace({
                  pathname: '/searching',
                  params: { id: String(newTripRequest.trip_request_id) },
                });
              },
              onError: (error) => {
                if (domainErrorCode(error) !== 'COMPANY_NOT_AVAILABLE') return;
                setQuote(freshQuote);
                markCompanyUnavailable(context.requestedCompany?.display_name ?? '');
                router.replace('/confirm');
              },
            },
          );
        },
      },
    );
  };

  return {
    run,
    repeatLast: () => run(lastKind.current),
    pending: quoteFare.isPending || createTripRequest.isPending,
    failed: quoteFare.isError || createTripRequest.isError,
  };
}
