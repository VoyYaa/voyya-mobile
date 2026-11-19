import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createSessionOnceGate } from './session-once-gate.ts';

describe('createSessionOnceGate', () => {
  it('lets one claim through per session', () => {
    const gate = createSessionOnceGate();
    assert.equal(gate.claim(10), true);
    assert.equal(gate.claim(10), false);
    assert.equal(gate.claim(20), true);
  });

  it('lets nothing through without a session', () => {
    assert.equal(createSessionOnceGate().claim(null), false);
  });

  it('keeps separate gates apart', () => {
    const first = createSessionOnceGate();
    const second = createSessionOnceGate();
    assert.equal(first.claim(10), true);
    assert.equal(second.claim(10), true);
  });
});
