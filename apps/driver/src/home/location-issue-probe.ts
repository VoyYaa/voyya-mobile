import type { LocationIssueKind } from '../state/useLocationIssueStore';

export type SystemPermissionProbe = 'denied' | 'allowed' | 'unknown';

export interface SystemLocationProbe {
  permission: SystemPermissionProbe;
  servicesEnabled: boolean | null;
}

export function nextLocationIssue(
  current: LocationIssueKind | null,
  probe: SystemLocationProbe,
): LocationIssueKind | null {
  if (probe.permission === 'denied') return 'permission_denied';
  if (probe.servicesEnabled === false) return 'gps_disabled';
  const systemIssue = current === 'permission_denied' || current === 'gps_disabled';
  const systemHealthy = probe.permission === 'allowed' && probe.servicesEnabled === true;
  if (systemIssue && systemHealthy) return null;
  return current;
}
