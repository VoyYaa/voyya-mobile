import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useNetworkStatus } from '@voyyaa/app-runtime';
import type { DriverLocationSharing } from '@voyyaa/shared';
import { deriveSharingIndicator, type SharingIndicator } from '../tracking/sharing-machine';
import { useSharingStore } from '../tracking/sharing-runtime';
import { useLocationIssueStore } from '../state/useLocationIssueStore';

const CLOCK_TICK_MS = 5000;
const MS_PER_SEC = 1000;

export interface SharingIndicatorModel {
  indicator: SharingIndicator;
  notificationsOff: boolean;
  iosForegroundOnly: boolean;
}

export function useSharingIndicator(sharing: DriverLocationSharing | null): SharingIndicatorModel {
  const machine = useSharingStore((s) => s.machine);
  const lastReadingAt = useSharingStore((s) => s.lastReadingAt);
  const notificationsGranted = useSharingStore((s) => s.notificationsGranted);
  const locationIssue = useLocationIssueStore((s) => s.issue);
  const offline = useNetworkStatus() === 'offline';
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const reference = Math.max(lastReadingAt ?? 0, machine.startedAt ?? 0);
  const silentForSec =
    reference === 0 ? 0 : Math.max(0, Math.round((now - reference) / MS_PER_SEC));
  const indicator = deriveSharingIndicator({
    status: machine.status,
    sharing,
    locationIssue,
    silentForSec,
    offline,
  });

  return {
    indicator,
    notificationsOff: machine.status === 'running' && notificationsGranted === false,
    iosForegroundOnly: indicator.kind === 'active' && Platform.OS === 'ios',
  };
}
