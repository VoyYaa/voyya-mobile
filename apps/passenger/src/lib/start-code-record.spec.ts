import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  START_CODE_RECORD_VERSION,
  msUntilExpiry,
  nextStartCodeRecord,
  parseStartCodeRecord,
  recordBelongsToAnotherTrip,
  recordValidity,
  serializeStartCodeRecord,
  toServerStartCode,
  usableRecord,
  type RecordProbe,
  type ServerStartCode,
  type StartCodeRecord,
} from './start-code-record.ts';

const TTL = 6 * 60 * 60 * 1000;
const REFRESH = 60 * 1000;
const NOW = 1_800_000_000_000;

function record(overrides: Partial<StartCodeRecord> = {}): StartCodeRecord {
  return {
    version: START_CODE_RECORD_VERSION,
    trip_request_id: 41,
    user_id: 7,
    start_code: '4821',
    saved_at: NOW - 1000,
    ...overrides,
  };
}

function server(overrides: Partial<ServerStartCode> = {}): ServerStartCode {
  return {
    trip_request_id: 41,
    start_code: '4821',
    start_code_state: 'active',
    ...overrides,
  };
}

describe('parseStartCodeRecord', () => {
  it('reads a valid version 2 record', () => {
    const parsed = parseStartCodeRecord(JSON.stringify(record()));
    assert.deepEqual(parsed, { kind: 'present', record: record() });
  });

  it('keeps leading zeros of the code', () => {
    const parsed = parseStartCodeRecord(JSON.stringify(record({ start_code: '0042' })));
    assert.equal(parsed.kind === 'present' && parsed.record.start_code, '0042');
  });

  it('treats a missing value as absent', () => {
    assert.deepEqual(parseStartCodeRecord(null), { kind: 'absent' });
  });

  it('discards the previous version, which had no user or time', () => {
    const legacy = JSON.stringify({ trip_request_id: 41, start_code: '4821' });
    assert.deepEqual(parseStartCodeRecord(legacy), { kind: 'invalid' });
  });

  it('marks as invalid anything that is not a complete version 2 record, and never throws', () => {
    const broken = [
      'not json',
      '',
      'null',
      '7',
      '"text"',
      '[]',
      JSON.stringify({ ...record(), version: 1 }),
      JSON.stringify({ ...record(), version: 3 }),
      JSON.stringify({ ...record(), trip_request_id: '41' }),
      JSON.stringify({ ...record(), trip_request_id: 4.5 }),
      JSON.stringify({ ...record(), user_id: '7' }),
      JSON.stringify({ ...record(), user_id: null }),
      JSON.stringify({ ...record(), saved_at: '1' }),
      JSON.stringify({ ...record(), saved_at: null }),
      JSON.stringify({ ...record(), start_code: '123' }),
      JSON.stringify({ ...record(), start_code: '12345' }),
      JSON.stringify({ ...record(), start_code: '12a4' }),
      JSON.stringify({ ...record(), start_code: 1234 }),
    ];
    for (const raw of broken) {
      assert.deepEqual(parseStartCodeRecord(raw), { kind: 'invalid' }, raw);
    }
  });

  it('drops any extra property it finds, so nothing else is ever carried forward', () => {
    const raw = JSON.stringify({ ...record(), name: 'Ana', plate: 'ABC101' });
    const parsed = parseStartCodeRecord(raw);
    assert.deepEqual(parsed, { kind: 'present', record: record() });
  });
});

describe('serializeStartCodeRecord', () => {
  it('writes exactly the five properties and nothing else (RN-CS-02)', () => {
    const written = JSON.parse(serializeStartCodeRecord(record())) as Record<string, unknown>;
    assert.deepEqual(Object.keys(written).sort(), [
      'saved_at',
      'start_code',
      'trip_request_id',
      'user_id',
      'version',
    ]);
  });

  it('round-trips through the parser', () => {
    assert.deepEqual(parseStartCodeRecord(serializeStartCodeRecord(record())), {
      kind: 'present',
      record: record(),
    });
  });
});

describe('recordValidity', () => {
  const context = { userId: 7, now: NOW, ttlMs: TTL };

  it('is valid for the same user inside the window', () => {
    assert.equal(recordValidity(record(), context), 'valid');
  });

  it('is not valid for another user, even when it is fresh', () => {
    assert.equal(recordValidity(record({ user_id: 8 }), context), 'other_user');
  });

  it('expires exactly at six hours, and not a millisecond before', () => {
    assert.equal(recordValidity(record({ saved_at: NOW - TTL + 1 }), context), 'valid');
    assert.equal(recordValidity(record({ saved_at: NOW - TTL }), context), 'expired');
    assert.equal(recordValidity(record({ saved_at: NOW - TTL - 1 }), context), 'expired');
  });

  it('rejects a saved time in the future, by one millisecond', () => {
    assert.equal(recordValidity(record({ saved_at: NOW + 1 }), context), 'future');
    assert.equal(recordValidity(record({ saved_at: NOW }), context), 'valid');
  });

  it('answers other_user before anything about time', () => {
    assert.equal(recordValidity(record({ user_id: 8, saved_at: NOW + 1 }), context), 'other_user');
  });
});

describe('msUntilExpiry', () => {
  it('counts down to six hours after the last confirmation', () => {
    assert.equal(msUntilExpiry(record({ saved_at: NOW - 1000 }), NOW, TTL), TTL - 1000);
  });

  it('is zero once the record has expired, never negative', () => {
    assert.equal(msUntilExpiry(record({ saved_at: NOW - TTL - 5 }), NOW, TTL), 0);
  });
});

describe('nextStartCodeRecord', () => {
  const base = { userId: 7, now: NOW, refreshMs: REFRESH };
  const screen = { ...base, allowCreate: true };
  const reconciler = { ...base, allowCreate: false };

  describe('without an active trip or without a code', () => {
    for (const [name, context] of [
      ['screen', screen],
      ['reconciler', reconciler],
    ] as const) {
      it(`${name}: clears an existing record when the server has no trip`, () => {
        assert.deepEqual(nextStartCodeRecord(record(), null, context), { kind: 'clear' });
      });

      it(`${name}: keeps nothing when there is neither record nor trip`, () => {
        assert.deepEqual(nextStartCodeRecord(null, null, context), { kind: 'keep' });
      });

      it(`${name}: clears an existing record in any state other than active`, () => {
        for (const state of ['blocked', 'not_required', 'not_applicable'] as const) {
          const response = server({ start_code: null, start_code_state: state });
          assert.deepEqual(
            nextStartCodeRecord(record(), response, context),
            { kind: 'clear' },
            state,
          );
        }
      });

      it(`${name}: keeps nothing when the state is not active and there is no record`, () => {
        const response = server({ start_code: null, start_code_state: 'blocked' });
        assert.deepEqual(nextStartCodeRecord(null, response, context), { kind: 'keep' });
      });

      it(`${name}: clears the record when active arrives without a four digit code`, () => {
        for (const code of [null, '123', '12345', 'abcd']) {
          const response = server({ start_code: code });
          assert.deepEqual(
            nextStartCodeRecord(record(), response, context),
            { kind: 'clear' },
            String(code),
          );
        }
      });
    }
  });

  describe('with an active trip and a code', () => {
    it('screen: creates the record when there is none, stamping the time', () => {
      assert.deepEqual(nextStartCodeRecord(null, server(), screen), {
        kind: 'write',
        record: record({ saved_at: NOW }),
      });
    });

    it('screen: replaces the record of another user or of another trip', () => {
      const expected = { kind: 'write', record: record({ saved_at: NOW }) };
      assert.deepEqual(nextStartCodeRecord(record({ user_id: 8 }), server(), screen), expected);
      assert.deepEqual(
        nextStartCodeRecord(record({ trip_request_id: 40 }), server(), screen),
        expected,
      );
    });

    it('reconciler: never creates a record, because saved means the passenger saw it', () => {
      assert.deepEqual(nextStartCodeRecord(null, server(), reconciler), { kind: 'keep' });
    });

    it('reconciler: clears the record of another user or of another trip', () => {
      assert.deepEqual(nextStartCodeRecord(record({ user_id: 8 }), server(), reconciler), {
        kind: 'clear',
      });
      assert.deepEqual(nextStartCodeRecord(record({ trip_request_id: 40 }), server(), reconciler), {
        kind: 'clear',
      });
    });

    for (const [name, context] of [
      ['screen', screen],
      ['reconciler', reconciler],
    ] as const) {
      it(`${name}: writes at once when the same trip has a new code`, () => {
        const response = server({ start_code: '7305' });
        assert.deepEqual(nextStartCodeRecord(record({ saved_at: NOW - 1 }), response, context), {
          kind: 'write',
          record: record({ start_code: '7305', saved_at: NOW }),
        });
      });

      it(`${name}: keeps the same code written 59 seconds ago and refreshes it at 60`, () => {
        assert.deepEqual(
          nextStartCodeRecord(record({ saved_at: NOW - (REFRESH - 1000) }), server(), context),
          { kind: 'keep' },
        );
        assert.deepEqual(
          nextStartCodeRecord(record({ saved_at: NOW - REFRESH }), server(), context),
          { kind: 'write', record: record({ saved_at: NOW }) },
        );
      });

      it(`${name}: refreshes a record saved in the future`, () => {
        assert.deepEqual(nextStartCodeRecord(record({ saved_at: NOW + 5000 }), server(), context), {
          kind: 'write',
          record: record({ saved_at: NOW }),
        });
      });
    }
  });

  it('writes only what U-10 allows, whatever else the server response carries', () => {
    const full = {
      ...server(),
      driver: { name: 'Ana', phone: '3001234567', plate: 'ABC101' },
      fare: { total: 8000 },
    } as ServerStartCode;
    const action = nextStartCodeRecord(null, full, screen);
    assert.equal(action.kind, 'write');
    if (action.kind !== 'write') return;
    const written = JSON.parse(serializeStartCodeRecord(action.record)) as Record<string, unknown>;
    assert.deepEqual(Object.keys(written).sort(), [
      'saved_at',
      'start_code',
      'trip_request_id',
      'user_id',
      'version',
    ]);
    assert.doesNotMatch(
      serializeStartCodeRecord(action.record),
      /Ana|3001234567|ABC101|fare|driver/,
    );
  });
});

describe('usableRecord', () => {
  const context = { tripRequestId: 41, userId: 7, now: NOW, ttlMs: TTL };
  const present = (overrides: Partial<StartCodeRecord> = {}): RecordProbe => ({
    kind: 'present',
    record: record(overrides),
  });

  it('gives the record when it is of this trip, of this user and inside the window', () => {
    assert.deepEqual(usableRecord(present(), context), record());
  });

  it('gives nothing for the record of another trip', () => {
    assert.equal(usableRecord(present({ trip_request_id: 40 }), context), null);
  });

  it('gives nothing for the record of another user', () => {
    assert.equal(usableRecord(present({ user_id: 8 }), context), null);
  });

  it('gives nothing once the window is over, or when the time is in the future', () => {
    assert.equal(usableRecord(present({ saved_at: NOW - TTL }), context), null);
    assert.equal(usableRecord(present({ saved_at: NOW + 1 }), context), null);
  });

  it('gives nothing without a trip or without a user', () => {
    assert.equal(usableRecord(present(), { ...context, tripRequestId: null }), null);
    assert.equal(usableRecord(present(), { ...context, userId: null }), null);
  });

  it('gives nothing while loading, when absent or when invalid', () => {
    for (const probe of [{ kind: 'loading' }, { kind: 'absent' }, { kind: 'invalid' }] as const) {
      assert.equal(usableRecord(probe, context), null, probe.kind);
    }
  });
});

describe('toServerStartCode', () => {
  it('keeps the three properties the record needs and drops the rest of the response', () => {
    const response = {
      trip_request_id: 41,
      start_code: '4821',
      start_code_state: 'active',
      driver: { name: 'Ana' },
    } as never;
    assert.deepEqual(toServerStartCode(response), {
      trip_request_id: 41,
      start_code: '4821',
      start_code_state: 'active',
    });
  });
});

describe('recordBelongsToAnotherTrip (CS-15)', () => {
  const present = (overrides: Partial<StartCodeRecord> = {}): RecordProbe => ({
    kind: 'present',
    record: record(overrides),
  });

  it('is true for the saved record of a different trip, which a link to a missing trip must not delete', () => {
    assert.equal(recordBelongsToAnotherTrip(present({ trip_request_id: 40 }), 41), true);
  });

  it('is false for the record of the same trip, even when it belongs to another user', () => {
    assert.equal(recordBelongsToAnotherTrip(present({ trip_request_id: 41 }), 41), false);
    assert.equal(recordBelongsToAnotherTrip(present({ user_id: 8 }), 41), false);
  });

  it('is false when the screen has no trip id', () => {
    assert.equal(recordBelongsToAnotherTrip(present(), null), false);
  });

  it('is false when there is nothing recognisable saved, so leftovers still get cleared', () => {
    for (const probe of [{ kind: 'loading' }, { kind: 'absent' }, { kind: 'invalid' }] as const) {
      assert.equal(recordBelongsToAnotherTrip(probe, 41), false, probe.kind);
    }
  });
});
