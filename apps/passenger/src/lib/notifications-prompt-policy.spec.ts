import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  NOTIFICATIONS_PROMPT_MAX_DECLINES,
  NOTIFICATIONS_PROMPT_SETTLE_MS,
  isPromptEligible,
  type PromptEligibilityInput,
} from './notifications-prompt-policy.ts';

const eligible: PromptEligibilityInput = {
  phase: 'searching',
  tripRequestId: 77,
  permission: 'undetermined',
  online: true,
  offeredTripId: null,
  declineCount: 0,
};

function check(overrides: Partial<PromptEligibilityInput>): boolean {
  return isPromptEligible({ ...eligible, ...overrides });
}

describe('isPromptEligible', () => {
  it('offers the sheet to a passenger who is searching, has not answered and is online', () => {
    assert.equal(check({}), true);
  });

  it('settles for a second and a half before the sheet appears', () => {
    assert.equal(NOTIFICATIONS_PROMPT_SETTLE_MS, 1500);
  });

  it('never offers it outside the search, so it never stands between the passenger and the request', () => {
    for (const phase of ['assigned', 'en_route', 'arrived', 'in_progress', 'ended'] as const) {
      assert.equal(check({ phase }), false, phase);
    }
  });

  it('only offers it while the system dialog has not been answered', () => {
    for (const permission of ['askable', 'blocked', 'granted', 'unsupported', 'unknown'] as const) {
      assert.equal(check({ permission }), false, permission);
    }
  });

  it('does not offer it without connection, because the registration would fail', () => {
    assert.equal(check({ online: false }), false);
  });

  it('offers it once per trip', () => {
    assert.equal(check({ offeredTripId: 77 }), false);
    assert.equal(check({ offeredTripId: 76 }), true);
  });

  it('stops offering it after two "Ahora no" in total', () => {
    assert.equal(NOTIFICATIONS_PROMPT_MAX_DECLINES, 2);
    assert.equal(check({ declineCount: 1 }), true);
    assert.equal(check({ declineCount: 2 }), false);
    assert.equal(check({ declineCount: 5 }), false);
  });
});
