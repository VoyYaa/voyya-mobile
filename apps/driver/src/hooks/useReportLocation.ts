import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Coordinate } from '@voyyaa/shared';
import { requestDeviceLocationBestEffort } from '@voyyaa/app-runtime';
import { reportDriverLocation } from '../api/driver.api';
import { useLocationIssueStore } from '../state/useLocationIssueStore';

export function useReportLocation() {
  return useMutation({
    mutationFn: (coordinate: Coordinate) => reportDriverLocation(coordinate),
    retry: false,
  });
}

export function useBestEffortLocationReport(): () => void {
  const reportLocation = useReportLocation();
  const mutate = reportLocation.mutate;
  const setIssue = useLocationIssueStore((s) => s.setIssue);

  return useCallback((): void => {
    void requestDeviceLocationBestEffort().then((outcome) => {
      if (outcome.kind === 'granted') {
        setIssue(null);
        mutate(outcome.coordinate);
        return;
      }
      setIssue(outcome.kind === 'permission_denied' ? 'permission_denied' : 'gps_disabled');
    });
  }, [mutate, setIssue]);
}
