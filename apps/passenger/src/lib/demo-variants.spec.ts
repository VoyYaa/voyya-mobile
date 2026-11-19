import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { callAction, trackingUnavailableDetail, tripCompletedBody } from './demo-variants.ts';

describe('callAction', () => {
  it('calls whenever there is a number, demo or not', () => {
    assert.equal(callAction('3000000000', false), 'call');
    assert.equal(callAction('3000000000', true), 'call');
  });

  it('keeps the disabled button of today for a real session without number', () => {
    assert.equal(callAction(null, false), 'disabled');
    assert.equal(callAction(undefined, false), 'disabled');
    assert.equal(callAction('', false), 'disabled');
  });

  it('hides the call button in a demo session without number (CA-DX-21)', () => {
    assert.equal(callAction(null, true), 'hidden');
  });
});

describe('copy variants', () => {
  it('keep the real text outside the demo', () => {
    assert.equal(trackingUnavailableDetail('real', false), 'real');
    assert.equal(tripCompletedBody('real', false), 'real');
  });

  it('say nothing about calling or about money charged in the demo', () => {
    const tracking = trackingUnavailableDetail('real', true);
    assert.doesNotMatch(tracking, /llamar/i);
    assert.equal(tripCompletedBody('real', true), 'Viaje de demostración: no se cobró dinero.');
  });
});
