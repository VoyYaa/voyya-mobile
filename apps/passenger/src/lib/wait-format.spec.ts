import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { RATE_LIMIT_FALLBACK_SEC, RATE_LIMIT_LONG_WAIT_SEC } from '../constants/parameters.ts';
import { formatWaitHours, waitCardText, waitSpoken } from './wait-format.ts';

const clock = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

describe('wait constants', () => {
  it('uses an hour as the threshold of the long wait and 90 seconds when the time is unknown', () => {
    assert.equal(RATE_LIMIT_LONG_WAIT_SEC, 3600);
    assert.equal(RATE_LIMIT_FALLBACK_SEC, 90);
  });
});

describe('formatWaitHours', () => {
  const table: ReadonlyArray<readonly [number, string]> = [
    [3600, '1 hora'],
    [3601, 'unas 2 horas'],
    [7200, 'unas 2 horas'],
    [7201, 'unas 3 horas'],
    [10800, 'unas 3 horas'],
    [43200, 'unas 12 horas'],
    [86399, 'unas 24 horas'],
    [86400, 'unas 24 horas'],
  ];

  for (const [seconds, expected] of table) {
    it(`words ${seconds} s as ${expected}, rounding up so nobody returns before it works`, () => {
      assert.equal(formatWaitHours(seconds), expected);
    });
  }
});

describe('waitSpoken', () => {
  const table: ReadonlyArray<readonly [number, string]> = [
    [-3, '0 segundos'],
    [0, '0 segundos'],
    [1, '1 segundo'],
    [45, '45 segundos'],
    [59, '59 segundos'],
    [60, '1 minuto'],
    [61, '2 minutos'],
    [252, '5 minutos'],
    [3540, '59 minutos'],
    [3599, '60 minutos'],
    [3600, '1 hora'],
    [3601, 'unas 2 horas'],
    [86400, 'unas 24 horas'],
  ];

  for (const [seconds, expected] of table) {
    it(`speaks ${seconds} s as ${expected}`, () => {
      assert.equal(waitSpoken(seconds), expected);
    });
  }
});

describe('waitCardText', () => {
  it('counts down a short wait with the clock and spells it out for the screen reader', () => {
    const text = waitCardText(252, clock);
    assert.equal(text.body, 'Por seguridad, espera 4:12 antes de intentarlo de nuevo.');
    assert.equal(text.spokenBody, 'Por seguridad, espera 5 minutos antes de intentarlo de nuevo.');
    assert.equal(text.ticking, true);
  });

  it('treats 3599 s as short and 3600 s as long', () => {
    assert.equal(waitCardText(RATE_LIMIT_LONG_WAIT_SEC - 1, clock).ticking, true);
    assert.equal(waitCardText(RATE_LIMIT_LONG_WAIT_SEC, clock).ticking, false);
  });

  it('shows hours and no countdown from an hour on', () => {
    const text = waitCardText(3600, clock);
    assert.equal(
      text.body,
      'Por seguridad, no podemos enviar más códigos por ahora. Vuelve a intentarlo en 1 hora.',
    );
    assert.equal(text.spokenBody, text.body);
    assert.equal(text.ticking, false);
  });

  it('never formats a day as minutes and seconds', () => {
    const clockSpy = (seconds: number): string => {
      throw new Error(`the clock was asked for ${seconds} s`);
    };
    const text = waitCardText(86400, clockSpy);
    assert.match(text.body, /unas 24 horas/);
    assert.doesNotMatch(text.body, /1440/);
  });

  it('keeps a long wait identical every second, so nothing changes on screen', () => {
    const reference = waitCardText(7200, clock);
    for (let seconds = 3601; seconds <= 7200; seconds += 1) {
      assert.deepEqual(waitCardText(seconds, clock), reference);
    }
  });

  it('changes a short wait every second', () => {
    assert.notEqual(waitCardText(100, clock).body, waitCardText(99, clock).body);
  });

  it('turns a long wait into a short one by itself when what is left drops below an hour', () => {
    assert.equal(waitCardText(3601, clock).ticking, false);
    assert.equal(waitCardText(3599, clock).ticking, true);
  });

  it('says there is no known time when the server did not send it', () => {
    const text = waitCardText(null, clock);
    assert.equal(
      text.body,
      'Por seguridad, no podemos enviar el código ahora. Inténtalo de nuevo más tarde.',
    );
    assert.equal(text.spokenBody, text.body);
    assert.equal(text.ticking, false);
  });
});
