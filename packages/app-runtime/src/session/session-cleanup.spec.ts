import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { onSessionCleared, runSessionClearedHandlers } from './session-cleanup.ts';

describe('session cleared handlers', () => {
  it('runs every registered handler when the session is cleared', async () => {
    const ran: string[] = [];
    const offA = onSessionCleared(() => void ran.push('a'));
    const offB = onSessionCleared(async () => void ran.push('b'));
    await runSessionClearedHandlers();
    assert.deepEqual(ran.sort(), ['a', 'b']);
    offA();
    offB();
  });

  it('keeps running the others, and does not reject, when one handler fails', async () => {
    const ran: string[] = [];
    const offFailing = onSessionCleared(async () => {
      throw new Error('storage');
    });
    const offOther = onSessionCleared(() => void ran.push('other'));
    await runSessionClearedHandlers();
    assert.deepEqual(ran, ['other']);
    offFailing();
    offOther();
  });

  it('waits for the asynchronous handlers before it resolves', async () => {
    let finished = false;
    const off = onSessionCleared(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 20));
      finished = true;
    });
    await runSessionClearedHandlers();
    assert.equal(finished, true);
    off();
  });

  it('stops running a handler once it is unsubscribed', async () => {
    let calls = 0;
    const off = onSessionCleared(() => void (calls += 1));
    off();
    await runSessionClearedHandlers();
    assert.equal(calls, 0);
  });
});
