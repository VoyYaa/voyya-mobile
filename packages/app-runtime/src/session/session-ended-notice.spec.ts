import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { SessionUser } from '@voyyaa/shared';
import { ApiError } from '../api/errors.ts';
import {
  endSessionByRejection,
  noticeForEndedSession,
  sessionEndedBodyOf,
  useSessionEndedNoticeStore,
  type SessionEndedNotice,
} from './session-ended-notice.ts';
import { createSessionRefresher } from './session-refresher.ts';

function userOf(demo: boolean): SessionUser {
  return {
    user_id: 1,
    first_name: 'Ana',
    last_name: 'Demo',
    role: 'passenger',
    tenant: null,
    profile_complete: true,
    pin_change_required: false,
    demo_session: demo
      ? {
          municipality_id: 1,
          municipality_name: 'Villa Demo',
          center: { lat: 1.5, lng: 2.5 },
          places: [],
        }
      : null,
  };
}

describe('noticeForEndedSession', () => {
  it('marks the notice as demo only when the session that ended was a demo one', () => {
    assert.deepEqual(noticeForEndedSession(userOf(true)), { demo: true });
    assert.deepEqual(noticeForEndedSession(userOf(false)), { demo: false });
  });

  it('raises nothing when there was no user', () => {
    assert.equal(noticeForEndedSession(null), null);
  });
});

describe('useSessionEndedNoticeStore', () => {
  beforeEach(() => useSessionEndedNoticeStore.getState().discard());

  it('is read once: the second take finds nothing', () => {
    useSessionEndedNoticeStore.getState().raise({ demo: true });
    assert.deepEqual(useSessionEndedNoticeStore.getState().take(), { demo: true });
    assert.equal(useSessionEndedNoticeStore.getState().take(), null);
  });

  it('is dropped by discard, as a new sign-in or a voluntary logout would', () => {
    useSessionEndedNoticeStore.getState().raise({ demo: false });
    useSessionEndedNoticeStore.getState().discard();
    assert.equal(useSessionEndedNoticeStore.getState().take(), null);
  });
});

describe('endSessionByRejection', () => {
  it('raises the notice before clearing, so the sign-in screen finds it', async () => {
    const order: string[] = [];
    await endSessionByRejection({
      getUser: () => userOf(true),
      raise: (notice) => order.push(`raise:${JSON.stringify(notice)}`),
      clear: async () => {
        order.push('clear');
      },
    });
    assert.deepEqual(order, ['raise:{"demo":true}', 'clear']);
  });
});

describe('a rejected refresh on an ended session', () => {
  let raised: Array<SessionEndedNotice | null>;
  let clears: number;

  function refresherFor(user: SessionUser, failure: Error) {
    return createSessionRefresher({
      getCurrent: () => ({ accessToken: 'a', refreshToken: 'r' }),
      requestRefresh: async () => {
        throw failure;
      },
      saveTokens: async () => undefined,
      getEpoch: () => 0,
      revoke: async () => undefined,
      clear: () =>
        endSessionByRejection({
          getUser: () => user,
          raise: (notice) => raised.push(notice),
          clear: async () => {
            clears += 1;
          },
        }),
    });
  }

  beforeEach(() => {
    raised = [];
    clears = 0;
  });

  it('shows the demo notice and clears when a demo session is rejected', async () => {
    const refresh = refresherFor(userOf(true), new ApiError('http', 'revoked', 401));
    assert.equal(await refresh('a'), null);
    assert.deepEqual(raised, [{ demo: true }]);
    assert.equal(clears, 1);
  });

  it('shows the plain notice when a real session is rejected', async () => {
    const refresh = refresherFor(userOf(false), new ApiError('http', 'revoked', 403));
    await refresh('a');
    assert.deepEqual(raised, [{ demo: false }]);
  });

  it('keeps the session and raises nothing with the network down or a 5xx', async () => {
    const network = refresherFor(userOf(true), new ApiError('network', 'offline'));
    await assert.rejects(() => network('a'));
    const server = refresherFor(userOf(true), new ApiError('http', 'boom', 503));
    await assert.rejects(() => server('a'));
    assert.deepEqual(raised, []);
    assert.equal(clears, 0);
  });
});

describe('sessionEndedBodyOf', () => {
  const copy = { body: 'plain', demoBody: 'demo' };

  it('uses the demo body only when the session that ended was a demo one', () => {
    assert.equal(sessionEndedBodyOf({ demo: true }, copy), 'demo');
    assert.equal(sessionEndedBodyOf({ demo: false }, copy), 'plain');
  });
});
