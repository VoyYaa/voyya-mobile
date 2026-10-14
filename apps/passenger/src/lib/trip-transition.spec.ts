import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { TripStatus } from '@voyyaa/shared';

import {
  assignedSeed,
  detectTripTransition,
  transitionNoticeText,
  type TripSnapshot,
  type TripTransitionNotice,
} from './trip-transition.ts';

const ARRIVED_AT = '2026-10-13T12:05:00.000Z';

function snap(status: TripStatus, arrivedAt: string | null = null, id = 77): TripSnapshot {
  return { tripRequestId: id, status, arrivedAt };
}

describe('detectTripTransition', () => {
  it('detects a driver who cancelled while the trip goes back to searching (E2a)', () => {
    assert.equal(
      detectTripTransition(snap('assigned'), snap('pending_assignment')),
      'driver_cancelled_searching',
    );
  });

  it('detects a driver who cancelled and ended the trip (E2b), from assigned or en route', () => {
    assert.equal(
      detectTripTransition(snap('assigned'), snap('cancelled_by_driver')),
      'driver_cancelled_ended',
    );
    assert.equal(
      detectTripTransition(snap('driver_en_route'), snap('cancelled_by_driver')),
      'driver_cancelled_ended',
    );
  });

  it('detects the arrival mark, once (E3)', () => {
    assert.equal(
      detectTripTransition(snap('driver_en_route'), snap('driver_en_route', ARRIVED_AT)),
      'driver_arrived',
    );
    assert.equal(
      detectTripTransition(
        snap('driver_en_route', ARRIVED_AT),
        snap('driver_en_route', ARRIVED_AT),
      ),
      null,
    );
  });

  it('detects the end of the search without a driver (E4)', () => {
    assert.equal(detectTripTransition(snap('pending_assignment'), snap('no_driver')), 'no_driver');
  });

  it('says nothing about the transitions the passenger already understands', () => {
    const quiet: ReadonlyArray<readonly [TripStatus, TripStatus]> = [
      ['pending_assignment', 'assigned'],
      ['assigned', 'driver_en_route'],
      ['driver_en_route', 'in_progress'],
      ['in_progress', 'completed'],
      ['assigned', 'cancelled_by_passenger'],
      ['driver_en_route', 'no_show'],
      ['pending_assignment', 'pending_assignment'],
    ];
    for (const [from, to] of quiet) {
      assert.equal(detectTripTransition(snap(from), snap(to)), null, `${from} -> ${to}`);
    }
  });

  it('says nothing when there is no earlier state to compare with', () => {
    assert.equal(detectTripTransition(null, snap('cancelled_by_driver')), null);
    assert.equal(detectTripTransition(null, snap('no_driver')), null);
  });

  it('never compares two different trips', () => {
    assert.equal(
      detectTripTransition(snap('assigned', null, 70), snap('pending_assignment', null, 71)),
      null,
    );
  });
});

describe('transitionNoticeText', () => {
  const expected: ReadonlyArray<readonly [TripTransitionNotice, string]> = [
    ['driver_cancelled_searching', 'Tu conductor canceló. Estamos buscando otro conductor.'],
    ['driver_cancelled_ended', 'Tu conductor canceló el viaje. Puedes pedir otro taxi.'],
    ['driver_arrived', 'Tu conductor indica que llegó.'],
    ['no_driver', 'No encontramos conductor. Puedes intentar de nuevo.'],
  ];

  for (const [kind, text] of expected) {
    it(`speaks ${kind} with the texts fixed by the design`, () => {
      assert.equal(transitionNoticeText(kind), text);
    });
  }
});

describe('assignedSeed (HU-CS-05)', () => {
  it('assumes an assigned trip when the screen is restored from the saved code and nothing was seen', () => {
    assert.deepEqual(assignedSeed(null, 77), snap('assigned', null, 77));
  });

  it('replaces what was seen of another trip', () => {
    assert.deepEqual(
      assignedSeed(snap('driver_en_route', null, 70), 77),
      snap('assigned', null, 77),
    );
  });

  it('keeps what was already seen of the same trip', () => {
    assert.equal(assignedSeed(snap('driver_en_route', null, 77), 77), null);
  });

  it('lets the first answer say the driver cancelled, even after a cold start', () => {
    const seed = assignedSeed(null, 77);
    assert.equal(
      detectTripTransition(seed, snap('pending_assignment')),
      'driver_cancelled_searching',
    );
    assert.equal(detectTripTransition(seed, snap('cancelled_by_driver')), 'driver_cancelled_ended');
  });

  it('stays silent when the first answer is still an assigned trip', () => {
    assert.equal(detectTripTransition(assignedSeed(null, 77), snap('assigned')), null);
    assert.equal(detectTripTransition(assignedSeed(null, 77), snap('driver_en_route')), null);
  });
});
