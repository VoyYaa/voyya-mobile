import { useEffect } from 'react';
import { AppState } from 'react-native';
import { areLocationServicesEnabled } from '@voyyaa/app-runtime';
import { nextLocationIssue } from '../home/location-issue-probe';
import { useLocationIssueStore } from '../state/useLocationIssueStore';
import { readSystemLocationPermission } from './useSystemLocationPermission';

export const LOCATION_ISSUE_WATCH_MS = 5000;

export function useLocationIssueWatch(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    const probe = (): void => {
      void Promise.all([readSystemLocationPermission(), areLocationServicesEnabled()]).then(
        ([permission, servicesEnabled]) => {
          if (!active) return;
          const { issue, setIssue } = useLocationIssueStore.getState();
          const next = nextLocationIssue(issue, { permission, servicesEnabled });
          if (next !== issue) setIssue(next);
        },
      );
    };
    probe();
    const interval = setInterval(probe, LOCATION_ISSUE_WATCH_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') probe();
    });
    return () => {
      active = false;
      clearInterval(interval);
      subscription.remove();
    };
  }, [enabled]);
}
