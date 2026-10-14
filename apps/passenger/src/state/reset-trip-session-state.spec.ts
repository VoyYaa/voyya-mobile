import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { resetTripSessionState } from './reset-trip-session-state.ts';
import { useTripDraftStore } from './useTripDraftStore.ts';
import { useTripTransitionStore } from './useTripTransitionStore.ts';

const pickup = { lat: 6.9647, lng: -75.4197, address: 'Parque Principal' } as never;
const dropoff = { lat: 6.9591, lng: -75.4181, address: 'Hospital' } as never;

function fillWithTheTripOfPreviousUser(): void {
  const draft = useTripDraftStore.getState();
  draft.setOrigin(pickup, 'manual');
  draft.setOriginDestination(pickup, dropoff);
  draft.setQuote({ fare: { total: 8000 } } as never);
  draft.markCompanyUnavailable('Cootrayal');
  draft.setLastAssignedDriver({
    tripRequestId: 41,
    identity: { name: 'Ana', plate: 'ABC101', companyId: 3 },
  });
  const transitions = useTripTransitionStore.getState();
  transitions.seedAssigned(41);
  transitions.observe({ tripRequestId: 41, status: 'pending_assignment', arrivedAt: null });
}

describe('resetTripSessionState (CS-13)', () => {
  beforeEach(() => {
    useTripDraftStore.getState().reset();
    useTripTransitionStore.getState().reset();
  });

  it('leaves the next user an empty draft: no pickup point, no destination, no quote', () => {
    fillWithTheTripOfPreviousUser();
    assert.notEqual(useTripDraftStore.getState().origin, null);

    resetTripSessionState();

    const draft = useTripDraftStore.getState();
    assert.equal(draft.origin, null);
    assert.equal(draft.originSource, null);
    assert.equal(draft.destination, null);
    assert.equal(draft.quote, null);
  });

  it('forgets the driver, the company choice and the unavailable company of the previous user', () => {
    fillWithTheTripOfPreviousUser();

    resetTripSessionState();

    const draft = useTripDraftStore.getState();
    assert.equal(draft.lastAssignedDriver, null);
    assert.equal(draft.unavailableCompanyName, null);
    assert.equal(draft.serviceType, 'taxi');
  });

  it('forgets what was seen of the trip, so the next user gets no notice about it', () => {
    fillWithTheTripOfPreviousUser();
    assert.notEqual(useTripTransitionStore.getState().lastSeen, null);

    resetTripSessionState();

    const transitions = useTripTransitionStore.getState();
    assert.equal(transitions.lastSeen, null);
    assert.equal(transitions.notice, null);
  });

  it('is harmless when there is nothing to forget', () => {
    resetTripSessionState();
    assert.equal(useTripDraftStore.getState().origin, null);
    assert.equal(useTripTransitionStore.getState().lastSeen, null);
  });
});
