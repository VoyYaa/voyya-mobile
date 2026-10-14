import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  codeChangedAfterRestore,
  spokenDigits,
  spokenPlate,
  startCodeCardView,
  startCodeShouldAnnounceStart,
  startCodeStatusLine,
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
    assert.deepEqual(startCodeCardView(base), {
      kind: 'code',
      code: '4821',
      note: 'online',
      savedAt: null,
    });
  });

  it('keeps leading zeros', () => {
    const view = startCodeCardView({
      ...base,
      response: { start_code: '0042', start_code_state: 'active' },
    });
    assert.deepEqual(view, { kind: 'code', code: '0042', note: 'online', savedAt: null });
  });

  it('C4: offline keeps showing the code and says it is the saved one', () => {
    assert.deepEqual(startCodeCardView({ ...base, offline: true }), {
      kind: 'code',
      code: '4821',
      note: 'saved_offline',
      savedAt: null,
    });
  });

  it('C5: a failed refresh keeps the code with its own note', () => {
    assert.deepEqual(startCodeCardView({ ...base, refreshFailed: true }), {
      kind: 'code',
      code: '4821',
      note: 'saved_refresh_failed',
      savedAt: null,
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
      savedAt: null,
    });
  });

  it('U-08: a saved code with no answer yet is checking, not a failed refresh', () => {
    assert.deepEqual(startCodeCardView({ ...base, response: null, saved: '7305' }), {
      kind: 'code',
      code: '7305',
      note: 'saved_checking',
      savedAt: null,
    });
  });

  it('U-08: a saved code with no answer and a failed refresh keeps its own note', () => {
    assert.deepEqual(
      startCodeCardView({ ...base, response: null, saved: '7305', refreshFailed: true }),
      { kind: 'code', code: '7305', note: 'saved_refresh_failed', savedAt: null },
    );
  });

  it('U-08: offline wins over a failed refresh and over checking', () => {
    for (const refreshFailed of [true, false]) {
      const view = startCodeCardView({
        ...base,
        response: null,
        saved: '7305',
        offline: true,
        refreshFailed,
      });
      assert.equal(view.kind === 'code' && view.note, 'saved_offline');
    }
  });

  it('carries the time the saved code was last confirmed, when it is known', () => {
    const view = startCodeCardView({
      ...base,
      response: null,
      saved: '7305',
      offline: true,
      savedAt: 1_800_000_000_000,
    });
    assert.equal(view.kind === 'code' && view.savedAt, 1_800_000_000_000);
  });

  it('never invents a time for a code that came from the server', () => {
    const view = startCodeCardView({ ...base, offline: true, savedAt: 1_800_000_000_000 });
    assert.equal(view.kind === 'code' && view.savedAt, null);
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

  it('falls back to the saved code when active arrives without one', () => {
    const view = startCodeCardView({
      ...base,
      response: { start_code: null, start_code_state: 'active' },
      saved: '7305',
    });
    assert.deepEqual(view, {
      kind: 'code',
      code: '7305',
      note: 'saved_refresh_failed',
      savedAt: null,
    });
  });
});

describe('startCodeStatusLine', () => {
  it('has no status line while the code is the live one', () => {
    assert.equal(startCodeStatusLine('online', null), null);
    assert.equal(startCodeStatusLine('online', 1_800_000_000_000), null);
  });

  it('with a saved time: the cause as title and the time as detail', () => {
    const savedAt = new Date(2026, 9, 14, 10, 42).getTime();
    assert.deepEqual(startCodeStatusLine('saved_offline', savedAt), {
      glyph: 'offline',
      title: 'Sin conexión',
      detail: 'Código guardado a las 10:42 a. m.',
      plain: false,
    });
    assert.deepEqual(startCodeStatusLine('saved_checking', savedAt), {
      glyph: 'checking',
      title: 'Revisando tu viaje…',
      detail: 'Código guardado a las 10:42 a. m.',
      plain: false,
    });
    assert.deepEqual(startCodeStatusLine('saved_refresh_failed', savedAt), {
      glyph: 'clock',
      title: 'No pudimos actualizar tu viaje',
      detail: 'Código guardado a las 10:42 a. m.',
      plain: false,
    });
  });

  it('says "a la 1:05" at one o clock', () => {
    const savedAt = new Date(2026, 9, 14, 13, 5).getTime();
    assert.equal(
      startCodeStatusLine('saved_offline', savedAt)?.detail,
      'Código guardado a la 1:05 p. m.',
    );
  });

  it('without a saved time, the open screen keeps today text, on one plain line', () => {
    assert.deepEqual(startCodeStatusLine('saved_offline', null), {
      glyph: 'offline',
      title: 'Sin conexión · mostrando el código guardado en tu teléfono.',
      detail: null,
      plain: true,
    });
    assert.deepEqual(startCodeStatusLine('saved_refresh_failed', null), {
      glyph: 'clock',
      title: 'No pudimos actualizar tu viaje · mostrando el código guardado.',
      detail: null,
      plain: true,
    });
  });

  it('without a saved time, checking is just its title', () => {
    assert.deepEqual(startCodeStatusLine('saved_checking', null), {
      glyph: 'checking',
      title: 'Revisando tu viaje…',
      detail: null,
      plain: true,
    });
  });
});

describe('codeChangedAfterRestore (HU-CS-05)', () => {
  const active = { start_code: '7305', start_code_state: 'active' };

  it('is true when the server gives another code than the one that was shown', () => {
    assert.equal(codeChangedAfterRestore('4821', active), true);
  });

  it('is false when the code is the same', () => {
    assert.equal(codeChangedAfterRestore('7305', active), false);
  });

  it('is false when no saved code was shown', () => {
    assert.equal(codeChangedAfterRestore(null, active), false);
  });

  it('is false when the server has no active code to compare', () => {
    for (const response of [
      { start_code: null, start_code_state: 'active' },
      { start_code: null, start_code_state: 'blocked' },
      { start_code: null, start_code_state: 'not_required' },
      { start_code: '7305', start_code_state: 'not_applicable' },
    ]) {
      assert.equal(codeChangedAfterRestore('4821', response), false, JSON.stringify(response));
    }
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
