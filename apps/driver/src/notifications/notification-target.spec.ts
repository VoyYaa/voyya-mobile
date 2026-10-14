import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PASSENGER_PUSH_NOTIFICATION_TYPES } from '@voyyaa/shared';

import { resolveDriverNotificationTarget } from './notification-target.ts';

const EXPIRES_AT = '2026-10-13T12:00:00.000Z';

function offer(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    type: 'assignment_offer',
    assignment_id: 41,
    trip_request_id: 77,
    expires_at: EXPIRES_AT,
    ...overrides,
  };
}

describe('resolveDriverNotificationTarget', () => {
  it('opens the offer screen of a valid assignment offer', () => {
    assert.deepEqual(resolveDriverNotificationTarget(offer()), {
      pathname: '/requests/[id]',
      params: { id: '41' },
    });
  });

  it('accepts ids delivered as text, as Android does', () => {
    assert.deepEqual(
      resolveDriverNotificationTarget(offer({ assignment_id: '41', trip_request_id: '77' })),
      { pathname: '/requests/[id]', params: { id: '41' } },
    );
  });

  for (const type of PASSENGER_PUSH_NOTIFICATION_TYPES) {
    it(`ignores the passenger notification ${type}`, () => {
      assert.equal(resolveDriverNotificationTarget({ type, trip_request_id: 77 }), null);
    });
  }

  it('ignores payloads that are absent or malformed', () => {
    assert.equal(resolveDriverNotificationTarget(undefined), null);
    assert.equal(resolveDriverNotificationTarget(null), null);
    assert.equal(resolveDriverNotificationTarget('assignment_offer'), null);
    assert.equal(resolveDriverNotificationTarget({}), null);
    assert.equal(resolveDriverNotificationTarget(offer({ type: 'unknown_type' })), null);
    assert.equal(resolveDriverNotificationTarget(offer({ expires_at: 'tomorrow' })), null);
  });

  it('rejects ids that are not safe integers of a row', () => {
    assert.equal(resolveDriverNotificationTarget(offer({ assignment_id: true })), null);
    assert.equal(resolveDriverNotificationTarget(offer({ assignment_id: '-1' })), null);
    assert.equal(resolveDriverNotificationTarget(offer({ assignment_id: '1.5' })), null);
    assert.equal(resolveDriverNotificationTarget(offer({ assignment_id: 2_147_483_648 })), null);
    assert.equal(resolveDriverNotificationTarget(offer({ trip_request_id: null })), null);
  });
});
