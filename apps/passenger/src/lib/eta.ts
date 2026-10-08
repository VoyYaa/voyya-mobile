import type { AssignedDriverSummary } from '@voyyaa/shared';

export function formatEta(eta: AssignedDriverSummary['eta']): string | null {
  if (!eta) return null;
  if (eta.min_minutes === eta.max_minutes) return `~${eta.min_minutes} min`;
  return `${eta.min_minutes}–${eta.max_minutes} min`;
}
