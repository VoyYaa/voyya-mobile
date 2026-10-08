import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { findNewOffer, isOfferUrgent, offerRailRatio } from './offer-rail.ts';

describe('offerRailRatio', () => {
  it('decreases from 1 to 0 as the offer expires', () => {
    assert.equal(offerRailRatio(15, 15), 1);
    assert.equal(offerRailRatio(6, 15), 0.4);
    assert.equal(offerRailRatio(0, 15), 0);
  });

  it('clamps values outside the window', () => {
    assert.equal(offerRailRatio(30, 15), 1);
    assert.equal(offerRailRatio(-3, 15), 0);
  });

  it('is empty when the response window is not positive', () => {
    assert.equal(offerRailRatio(5, 0), 0);
  });
});

describe('isOfferUrgent', () => {
  it('turns urgent in the last threshold seconds, inclusive', () => {
    assert.equal(isOfferUrgent(6, 5), false);
    assert.equal(isOfferUrgent(5, 5), true);
    assert.equal(isOfferUrgent(0, 5), true);
  });
});

describe('findNewOffer', () => {
  const offers = [{ assignment_id: 1 }, { assignment_id: 2 }];

  it('returns the first offer that was not seen', () => {
    assert.deepEqual(findNewOffer(offers, new Set([1])), { assignment_id: 2 });
  });

  it('returns null when every offer was already seen', () => {
    assert.equal(findNewOffer(offers, new Set([1, 2])), null);
  });

  it('returns null for an empty list', () => {
    assert.equal(findNewOffer([], new Set()), null);
  });
});
