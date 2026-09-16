import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Coordinate } from '@voyyaa/shared';
import { reportDriverLocation } from '../api/driver.api';
import { requestDeviceLocation } from '../location/device-location';

export function useReportLocation() {
  return useMutation({
    mutationFn: (coordinate: Coordinate) => reportDriverLocation(coordinate),
    retry: false,
  });
}

export function useBestEffortLocationReport(): () => void {
  const reportLocation = useReportLocation();
  const mutate = reportLocation.mutate;

  return useCallback((): void => {
    void requestDeviceLocation().then((outcome) => {
      if (outcome.kind === 'granted') {
        mutate(outcome.coordinate);
      }
    });
  }, [mutate]);
}
