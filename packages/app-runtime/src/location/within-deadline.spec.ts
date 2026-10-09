import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { withinDeadline } from './within-deadline.ts';

const never = (): Promise<string> => new Promise<string>(() => undefined);

describe('withinDeadline', () => {
  it('resolves with the value when the promise settles in time', async () => {
    const result = await withinDeadline(Promise.resolve('ok'), 50, () => 'late');
    assert.equal(result, 'ok');
  });

  it('resolves with the fallback when the promise never settles', async () => {
    const result = await withinDeadline(never(), 20, () => 'late');
    assert.equal(result, 'late');
  });

  it('propagates a rejection that happens before the deadline', async () => {
    await assert.rejects(
      withinDeadline(Promise.reject(new Error('boom')), 50, () => 'late'),
      /boom/,
    );
  });
});
