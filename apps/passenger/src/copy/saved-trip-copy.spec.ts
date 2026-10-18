import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { savedStartCodeCopy, savedTripCopy } from './saved-trip-copy.ts';
import { formatClockTime } from '../lib/driver-tracking-presentation.ts';

const FORBIDDEN =
  /va en camino|llegó|te espera|te está esperando|conductor asignado|en vivo|actualizado hace|funciona sin conexión|modo sin conexión|modo offline/i;

const passengerCopySource = readFileSync(new URL('./passenger-copy.ts', import.meta.url), 'utf8');

function literal(key: string): string {
  const match = new RegExp(`\\b${key}:\\s*'([^']*)'`).exec(passengerCopySource);
  assert.ok(match, `${key} is a literal in passenger-copy.ts`);
  return match[1] as string;
}

function flatten(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (typeof value === 'object' && value !== null) return Object.values(value).flatMap(flatten);
  return [];
}

const SHOWN_IN_SAVED_VIEW: readonly string[] = [
  ...flatten(savedTripCopy),
  savedStartCodeCopy.offlineTitle,
  savedStartCodeCopy.checkingTitle,
  savedStartCodeCopy.errorTitle,
  savedStartCodeCopy.openOffline,
  savedStartCodeCopy.openRefreshFailed,
  savedStartCodeCopy.savedAt('10:42 a. m.'),
  savedStartCodeCopy.savedAt('1:05 p. m.'),
  literal('instructionNoPlate'),
  literal('cancelOfflineHint'),
  literal('cancelTrip'),
  literal('pickupLabel'),
];

describe('saved trip copy (RN-CS-07)', () => {
  it('claims nothing in the present about the driver or the trip', () => {
    for (const text of SHOWN_IN_SAVED_VIEW) {
      assert.doesNotMatch(text, FORBIDDEN, text);
    }
  });

  it('says it is the last state it knows, and that the driver may have cancelled or changed', () => {
    assert.equal(savedTripCopy.notice.title, 'Este es el último estado que conocemos');
    for (const body of Object.values(savedTripCopy.notice.body)) {
      assert.match(body, /Tu conductor pudo cancelar o cambiar desde entonces\./);
    }
  });

  it('never tells a passenger with a network to connect, because that would be false', () => {
    assert.match(savedTripCopy.notice.body.offline, /Conéctate para confirmar/);
    assert.doesNotMatch(savedTripCopy.notice.body.checking, /Conéctate/);
    assert.doesNotMatch(savedTripCopy.notice.body.error, /Conéctate/);
  });

  it('promises neither deletion at six hours nor any retention period', () => {
    for (const text of SHOWN_IN_SAVED_VIEW) {
      assert.doesNotMatch(text, /6 h|seis horas|se borra|se elimina|horas/i, text);
    }
  });

  it('does not name the plate, the driver or any plan of the taxi', () => {
    for (const text of SHOWN_IN_SAVED_VIEW) {
      assert.doesNotMatch(text, /placa|conductor [A-ZÁÉÍÓÚ]|teléfono del conductor/, text);
    }
  });

  it('keeps the instruction as the one without a plate, and the warning about the phone', () => {
    assert.equal(
      literal('instructionNoPlate'),
      'Dáselo en persona, cuando veas el taxi. No lo des por teléfono.',
    );
  });
});

describe('savedAt (D-DX-03)', () => {
  it('says "a la" only at one o clock and "a las" at every other hour', () => {
    assert.equal(
      savedStartCodeCopy.savedAt(formatClockTime(new Date(2026, 9, 14, 13, 5))),
      'Código guardado a la 1:05 p. m.',
    );
    assert.equal(
      savedStartCodeCopy.savedAt(formatClockTime(new Date(2026, 9, 14, 1, 5))),
      'Código guardado a la 1:05 a. m.',
    );
    assert.equal(
      savedStartCodeCopy.savedAt(formatClockTime(new Date(2026, 9, 14, 10, 42))),
      'Código guardado a las 10:42 a. m.',
    );
    assert.equal(
      savedStartCodeCopy.savedAt(formatClockTime(new Date(2026, 9, 14, 0, 5))),
      'Código guardado a las 12:05 a. m.',
    );
    assert.equal(
      savedStartCodeCopy.savedAt(formatClockTime(new Date(2026, 9, 14, 12, 30))),
      'Código guardado a las 12:30 p. m.',
    );
  });

  it('does not take 11 or 12 for one o clock', () => {
    for (const hour of [11, 12, 23]) {
      const text = savedStartCodeCopy.savedAt(formatClockTime(new Date(2026, 9, 14, hour, 0)));
      assert.match(text, /a las /, String(hour));
    }
  });
});

describe('accessibility text', () => {
  it('reads the digits apart, the status with its time and the instruction, in one sentence group', () => {
    const status = savedStartCodeCopy.spokenStatus(
      savedStartCodeCopy.offlineTitle,
      savedStartCodeCopy.savedAt('10:42 a. m.'),
    );
    assert.equal(
      savedStartCodeCopy.accessibility(
        '3, 8, 5, 5',
        'Dáselo en persona, cuando veas el taxi. No lo des por teléfono.',
        status,
      ),
      'Tu código de inicio: 3, 8, 5, 5. Sin conexión. Código guardado a las 10:42 a. m. Dáselo en persona, cuando veas el taxi. No lo des por teléfono.',
    );
  });

  it('keeps the checking title as it is, without a stray period after the ellipsis', () => {
    const status = savedStartCodeCopy.spokenStatus(
      savedStartCodeCopy.checkingTitle,
      savedStartCodeCopy.savedAt('10:42 a. m.'),
    );
    assert.equal(status, 'Revisando tu viaje… Código guardado a las 10:42 a. m.');
  });

  it('reads the legacy one line status without the middle dot', () => {
    assert.equal(
      savedStartCodeCopy.spokenStatus(savedStartCodeCopy.openOffline, null),
      'Sin conexión. mostrando el código guardado en tu teléfono.',
    );
    assert.equal(
      savedStartCodeCopy.spokenStatus(savedStartCodeCopy.openRefreshFailed, null),
      'No pudimos actualizar tu viaje. mostrando el código guardado.',
    );
  });

  it('is the same sentence as today when there is no status', () => {
    assert.equal(
      savedStartCodeCopy.accessibility('4, 8, 2, 1', 'Dáselo en persona.', null),
      'Tu código de inicio: 4, 8, 2, 1. Dáselo en persona.',
    );
  });
});
