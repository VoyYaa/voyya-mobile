import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { DriverTracking } from '@voyyaa/shared';

import {
  agoText,
  formatClockTime,
  trackingAnnouncement,
  trackingModel,
  type TrackingInput,
} from './driver-tracking-presentation.ts';

const tracking = (position: DriverTracking['position'], windowAgeSec = 100): DriverTracking => ({
  window_age_sec: windowAgeSec,
  stale_after_sec: 45,
  hide_after_sec: 300,
  position,
});

const at = (ageSec: number) => ({ lat: 6.96, lng: -75.41, age_sec: ageSec });

const base = (overrides: Partial<TrackingInput> = {}): TrackingInput => ({
  tracking: tracking(at(5)),
  elapsedSec: 0,
  offline: false,
  refreshFailed: false,
  resuming: false,
  arrived: false,
  ...overrides,
});

describe('trackingModel', () => {
  it('has no card outside the window', () => {
    assert.equal(trackingModel(base({ tracking: null })), null);
  });

  it('T2: live marker with the server age plus the time since the answer', () => {
    const model = trackingModel(base({ elapsedSec: 10 }));
    assert.equal(model?.kind, 'live');
    assert.equal(model?.marker?.freshness, 'live');
    assert.equal(model?.ageSec, 15);
  });

  it('T3: arrived keeps the live marker with its own text', () => {
    assert.equal(trackingModel(base({ arrived: true }))?.kind, 'arrived');
  });

  it('T4: freezes at the server threshold, not before, and keeps the marker dashed', () => {
    assert.equal(trackingModel(base({ tracking: tracking(at(44)) }))?.kind, 'live');
    const frozen = trackingModel(base({ tracking: tracking(at(45)) }));
    assert.equal(frozen?.kind, 'stale');
    assert.equal(frozen?.marker?.freshness, 'stale');
  });

  it('counts the time since the answer towards the threshold', () => {
    assert.equal(trackingModel(base({ tracking: tracking(at(30)), elapsedSec: 14 }))?.kind, 'live');
    assert.equal(
      trackingModel(base({ tracking: tracking(at(30)), elapsedSec: 15 }))?.kind,
      'stale',
    );
  });

  it('T5: removes the marker at the hide threshold and never says why', () => {
    const hidden = trackingModel(base({ tracking: tracking(at(300)) }));
    assert.equal(hidden?.kind, 'unavailable');
    assert.equal(hidden?.marker, null);
  });

  it('T1: the grace after accepting uses the server threshold and shows no marker', () => {
    const locating = trackingModel(base({ tracking: tracking(null, 10) }));
    assert.equal(locating?.kind, 'locating');
    assert.equal(locating?.marker, null);
    assert.equal(trackingModel(base({ tracking: tracking(null, 44) }))?.kind, 'locating');
    assert.equal(trackingModel(base({ tracking: tracking(null, 45) }))?.kind, 'unavailable');
  });

  it('T6: the passenger being offline wins over blaming the driver', () => {
    const offline = trackingModel(base({ tracking: tracking(at(200)), offline: true }));
    assert.equal(offline?.kind, 'offline');
    assert.equal(offline?.marker?.freshness, 'stale');
    const failed = trackingModel(base({ tracking: tracking(at(10)), refreshFailed: true }));
    assert.equal(failed?.kind, 'refresh_failed');
    assert.equal(failed?.marker?.freshness, 'stale');
  });

  it('T6: with no position ever, only the pickup pin remains', () => {
    const model = trackingModel(base({ tracking: tracking(null), offline: true }));
    assert.equal(model?.kind, 'offline');
    assert.equal(model?.marker, null);
  });

  it('T6: a position older than the hide threshold is not drawn even offline', () => {
    const model = trackingModel(base({ tracking: tracking(at(400)), offline: true }));
    assert.equal(model?.marker, null);
  });

  it('T10: right after coming back to the foreground, the marker stays as it was', () => {
    const model = trackingModel(
      base({ tracking: tracking(at(5)), elapsedSec: 120, resuming: true }),
    );
    assert.equal(model?.kind, 'resuming');
    assert.equal(model?.marker?.freshness, 'live');
  });

  it('T10 wins over offline and failures while the fresh answer is on its way', () => {
    assert.equal(
      trackingModel(base({ resuming: true, offline: true, refreshFailed: true }))?.kind,
      'resuming',
    );
  });
});

describe('agoText', () => {
  it('speaks in rounded language, not in a ticking counter', () => {
    assert.deepEqual(agoText(0), { kind: 'moments' });
    assert.deepEqual(agoText(19), { kind: 'moments' });
    assert.deepEqual(agoText(20), { kind: 'seconds', value: 20 });
    assert.deepEqual(agoText(27), { kind: 'seconds', value: 25 });
    assert.deepEqual(agoText(59), { kind: 'seconds', value: 55 });
    assert.deepEqual(agoText(60), { kind: 'minutes', value: 1 });
    assert.deepEqual(agoText(150), { kind: 'minutes', value: 2 });
    assert.deepEqual(agoText(3600), { kind: 'hours', value: 1 });
  });
});

describe('trackingAnnouncement', () => {
  it('announces only transitions that matter', () => {
    assert.equal(trackingAnnouncement('live', 'stale'), 'frozen');
    assert.equal(trackingAnnouncement('stale', 'live'), 'back');
    assert.equal(trackingAnnouncement('stale', 'unavailable'), 'unavailable');
    assert.equal(trackingAnnouncement('live', 'arrived'), 'arrived');
  });

  it('does not announce updates of the same state or the first read', () => {
    assert.equal(trackingAnnouncement('live', 'live'), null);
    assert.equal(trackingAnnouncement(null, 'live'), null);
    assert.equal(trackingAnnouncement('live', 'offline'), null);
    assert.equal(trackingAnnouncement('locating', 'live'), null);
  });
});

describe('formatClockTime', () => {
  it('writes the hour the way people in Colombia read it', () => {
    assert.equal(formatClockTime(new Date(2026, 9, 9, 10, 42)), '10:42 a. m.');
    assert.equal(formatClockTime(new Date(2026, 9, 9, 0, 5)), '12:05 a. m.');
    assert.equal(formatClockTime(new Date(2026, 9, 9, 12, 0)), '12:00 p. m.');
    assert.equal(formatClockTime(new Date(2026, 9, 9, 17, 9)), '5:09 p. m.');
  });
});
