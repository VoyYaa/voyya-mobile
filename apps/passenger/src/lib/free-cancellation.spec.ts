import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  freeCancellationDeadlineIso,
  freeCancellationRemainingSec,
  type FreeCancellationReading,
} from './free-cancellation.ts';

const SERVER_NOW = '2026-10-08T15:00:00.000Z';
const THIRTY_SECONDS_LEFT = '2026-10-08T15:00:30.000Z';
const ALREADY_EXPIRED = '2026-10-08T14:58:50.000Z';
const PHONE_NOW_MS = Date.parse('2026-10-08T15:00:01.000Z');
const FIVE_MINUTES_MS = 5 * 60_000;

function reading(until: string | null, receivedAtMs = PHONE_NOW_MS): FreeCancellationReading {
  return { freeCancellationUntil: until, serverTime: SERVER_NOW, receivedAtMs };
}

describe('freeCancellationRemainingSec', () => {
  it('returns the server remaining time at the moment of receipt', () => {
    assert.equal(freeCancellationRemainingSec(reading(THIRTY_SECONDS_LEFT), PHONE_NOW_MS), 30);
  });

  it('discounts the time elapsed on the phone since the response arrived', () => {
    assert.equal(
      freeCancellationRemainingSec(reading(THIRTY_SECONDS_LEFT), PHONE_NOW_MS + 12_000),
      18,
    );
  });

  it('reaches zero and never goes negative', () => {
    assert.equal(
      freeCancellationRemainingSec(reading(THIRTY_SECONDS_LEFT), PHONE_NOW_MS + 45_000),
      0,
    );
  });

  it('returns zero when the server window already closed (reopened app, 130 s after assignment)', () => {
    assert.equal(freeCancellationRemainingSec(reading(ALREADY_EXPIRED), PHONE_NOW_MS), 0);
  });

  it('returns zero when the server sends no window', () => {
    assert.equal(freeCancellationRemainingSec(reading(null), PHONE_NOW_MS), 0);
  });

  it('is immune to a phone clock five minutes ahead', () => {
    const received = PHONE_NOW_MS + FIVE_MINUTES_MS;
    assert.equal(
      freeCancellationRemainingSec(reading(THIRTY_SECONDS_LEFT, received), received),
      30,
    );
    assert.equal(
      freeCancellationRemainingSec(reading(THIRTY_SECONDS_LEFT, received), received + 10_000),
      20,
    );
  });

  it('is immune to a phone clock five minutes behind', () => {
    const received = PHONE_NOW_MS - FIVE_MINUTES_MS;
    assert.equal(
      freeCancellationRemainingSec(reading(THIRTY_SECONDS_LEFT, received), received),
      30,
    );
    assert.equal(freeCancellationRemainingSec(reading(ALREADY_EXPIRED, received), received), 0);
  });

  it('gives the same answer after a reopen as a fresh response says', () => {
    const reopenedReading: FreeCancellationReading = {
      freeCancellationUntil: THIRTY_SECONDS_LEFT,
      serverTime: '2026-10-08T15:00:20.000Z',
      receivedAtMs: PHONE_NOW_MS + 20_000,
    };
    assert.equal(freeCancellationRemainingSec(reopenedReading, PHONE_NOW_MS + 20_000), 10);
  });

  it('returns zero for unparseable timestamps', () => {
    assert.equal(
      freeCancellationRemainingSec(
        { freeCancellationUntil: 'nope', serverTime: SERVER_NOW, receivedAtMs: PHONE_NOW_MS },
        PHONE_NOW_MS,
      ),
      0,
    );
  });
});

describe('freeCancellationDeadlineIso', () => {
  it('anchors the server deadline on the phone clock', () => {
    assert.equal(
      freeCancellationDeadlineIso(reading(THIRTY_SECONDS_LEFT)),
      new Date(PHONE_NOW_MS + 30_000).toISOString(),
    );
  });

  it('is null without a window', () => {
    assert.equal(freeCancellationDeadlineIso(reading(null)), null);
  });
});
