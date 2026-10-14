import type { PushPermission } from '@voyyaa/app-runtime';
import type { TripPhase } from './trip-phase';

export const NOTIFICATIONS_PROMPT_SETTLE_MS = 1500;
export const NOTIFICATIONS_PROMPT_MAX_DECLINES = 2;

export interface PromptEligibilityInput {
  phase: TripPhase;
  tripRequestId: number;
  permission: PushPermission | 'unknown';
  online: boolean;
  offeredTripId: number | null;
  declineCount: number;
}

export function isPromptEligible(input: PromptEligibilityInput): boolean {
  return (
    input.phase === 'searching' &&
    input.permission === 'undetermined' &&
    input.online &&
    input.offeredTripId !== input.tripRequestId &&
    input.declineCount < NOTIFICATIONS_PROMPT_MAX_DECLINES
  );
}
