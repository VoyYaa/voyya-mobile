import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  spokenDigits,
  spokenPlate,
  startCodeCardView,
  startCodeShouldAnnounceStart,
  type StartCodeViewInput,
} from './start-code-view.ts';

const base: StartCodeViewInput = {
  response: { start_code: '4821', start_code_state: 'active' },
  saved: null,
  offline: false,
  refreshFailed: false,
};

describe('startCodeCardView', () => {
  it('C3: shows the code the server sent', () => {
    assert.deepEqual(startCodeCardView(base), { kind: 'code', code: '4821', note: 'online' });
  });

  it('keeps leading zeros', () => {
    const view = startCodeCardView({
      ...base,
      response: { start_code: '0042', start_code_state: 'active' },
    });
    assert.deepEqual(view, { kind: 'code', code: '0042', note: 'online' });
  });

  it('C4: offline keeps showing the code and says it is the saved one', () => {
    assert.deepEqual(startCodeCardView({ ...base, offline: true }), {
      kind: 'code',
      code: '4821',
      note: 'saved_offline',
    });
  });

  it('C5: a failed refresh keeps the code with its own note', () => {
    assert.deepEqual(startCodeCardView({ ...base, refreshFailed: true }), {
      kind: 'code',
      code: '4821',
      note: 'saved_refresh_failed',
    });
  });

  it('C2: loads while there is no answer yet, never inventing digits', () => {
    const view = startCodeCardView({ ...base, response: null });
    assert.deepEqual(view, { kind: 'loading' });
  });

  it('shows the saved code when there is no answer and the phone is offline', () => {
    assert.deepEqual(startCodeCardView({ ...base, response: null, saved: '7305', offline: true }), {
      kind: 'code',
      code: '7305',
      note: 'saved_offline',
    });
  });

  it('C6: without answer and without saved code, offline asks to connect', () => {
    assert.deepEqual(startCodeCardView({ ...base, response: null, offline: true }), {
      kind: 'empty',
      reason: 'offline',
    });
  });

  it('C7: without answer and without saved code, an error offers a retry', () => {
    assert.deepEqual(startCodeCardView({ ...base, response: null, refreshFailed: true }), {
      kind: 'empty',
      reason: 'error',
    });
  });

  it('C9: blocked hides the code even if one was saved', () => {
    const view = startCodeCardView({
      ...base,
      response: { start_code: null, start_code_state: 'blocked' },
      saved: '4821',
    });
    assert.deepEqual(view, { kind: 'blocked' });
  });

  it('C1: legacy trips and trips outside the window have no card, and no error', () => {
    for (const state of ['not_required', 'not_applicable']) {
      const view = startCodeCardView({
        ...base,
        response: { start_code: null, start_code_state: state },
        saved: '4821',
      });
      assert.deepEqual(view, { kind: 'hidden' }, state);
    }
  });

  it('never leaves an empty field when active arrives without a code', () => {
    const view = startCodeCardView({
      ...base,
      response: { start_code: null, start_code_state: 'active' },
    });
    assert.equal(view.kind, 'empty');
  });
});

describe('screen reader text', () => {
  it('separates the digits so TalkBack and VoiceOver never read a number', () => {
    assert.equal(spokenDigits('4821'), '4, 8, 2, 1');
    assert.equal(spokenDigits('0042'), '0, 0, 4, 2');
    assert.equal(spokenDigits('0000'), '0, 0, 0, 0');
  });

  it('spells the plate', () => {
    assert.equal(spokenPlate('abc-123'), 'A, B, C, 1, 2, 3');
  });
});

describe('startCodeShouldAnnounceStart', () => {
  it('announces once when a visible card gives way to a trip in progress', () => {
    assert.equal(startCodeShouldAnnounceStart('code', true), true);
    assert.equal(startCodeShouldAnnounceStart('blocked', true), true);
  });

  it('stays quiet when there was no card or the trip is not in progress', () => {
    assert.equal(startCodeShouldAnnounceStart('hidden', true), false);
    assert.equal(startCodeShouldAnnounceStart(null, true), false);
    assert.equal(startCodeShouldAnnounceStart('code', false), false);
  });
});
