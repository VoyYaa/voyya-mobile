import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConsentStatus } from '@voyyaa/shared';
import { useSessionStore } from '../session/useSessionStore';
import {
  grantLocationConsent,
  refreshLocationConsent,
  revokeLocationConsent,
} from './location-consent';

export const LOCATION_CONSENT_QUERY_KEY = ['consents', 'location'] as const;

export function useLocationConsentStatus() {
  const isAuthenticated = useSessionStore((s) => s.status === 'authenticated');
  return useQuery({
    queryKey: LOCATION_CONSENT_QUERY_KEY,
    queryFn: refreshLocationConsent,
    enabled: isAuthenticated,
  });
}

export function useGrantLocationConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: grantLocationConsent,
    onSuccess: (status: ConsentStatus) => {
      queryClient.setQueryData(LOCATION_CONSENT_QUERY_KEY, status);
    },
  });
}

export function useRevokeLocationConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeLocationConsent,
    onSuccess: (status: ConsentStatus) => {
      queryClient.setQueryData(LOCATION_CONSENT_QUERY_KEY, status);
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: LOCATION_CONSENT_QUERY_KEY });
    },
  });
}
