import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isPinChangeReady, onlyDigits, pinRuleStatus, validatePinChange } from './pin-rules.ts';

describe('onlyDigits', () => {
  it('strips non digits and caps the length', () => {
    assert.equal(onlyDigits('48a2-91 7', 6), '482917');
    assert.equal(onlyDigits('1234567', 6), '123456');
  });
});

describe('validatePinChange', () => {
  it('accepts a strong new PIN that matches its confirmation', () => {
    assert.deepEqual(
      validatePinChange({ current: '4821', next: '482913', confirmation: '482913' }),
      {},
    );
  });

  it('uses the contract messages for length, digits and weakness', () => {
    assert.equal(
      validatePinChange({ current: null, next: '4829', confirmation: '4829' }).next,
      'El PIN debe tener 6 dígitos',
    );
    assert.equal(
      validatePinChange({ current: null, next: '48a913', confirmation: '48a913' }).next,
      'El PIN solo lleva números',
    );
    for (const weak of ['123456', '111111', '121212', '654321', '000000']) {
      assert.equal(
        validatePinChange({ current: null, next: weak, confirmation: weak }).next,
        'Elige un PIN menos fácil de adivinar',
        weak,
      );
    }
  });

  it('rejects a new PIN equal to the one received when the app still has it', () => {
    assert.equal(
      validatePinChange({ current: '482913', next: '482913', confirmation: '482913' }).next,
      'El PIN nuevo debe ser distinto del que recibiste',
    );
  });

  it('does not check equality when the current PIN is unknown to the app', () => {
    assert.deepEqual(
      validatePinChange({ current: null, next: '482913', confirmation: '482913' }),
      {},
    );
  });

  it('flags a confirmation that differs, without calling a valid PIN weak', () => {
    assert.deepEqual(validatePinChange({ current: null, next: '482913', confirmation: '482914' }), {
      confirmation: 'mismatch',
    });
  });

  it('does not add a mismatch while the new PIN itself is invalid', () => {
    const errors = validatePinChange({ current: null, next: '1234', confirmation: '999' });
    assert.equal(errors.confirmation, undefined);
    assert.ok(errors.next);
  });

  it('flags a malformed current PIN when its field is visible', () => {
    assert.ok(validatePinChange({ current: '12', next: '482913', confirmation: '482913' }).current);
  });
});

describe('isPinChangeReady', () => {
  it('is ready only with a full, strong, confirmed PIN', () => {
    assert.equal(
      isPinChangeReady({ current: '4821', next: '482913', confirmation: '482913' }),
      true,
    );
    assert.equal(
      isPinChangeReady({ current: '4821', next: '48291', confirmation: '48291' }),
      false,
    );
    assert.equal(isPinChangeReady({ current: '4821', next: '482913', confirmation: '' }), false);
    assert.equal(
      isPinChangeReady({ current: '4821', next: '123456', confirmation: '123456' }),
      false,
    );
    assert.equal(isPinChangeReady({ current: '', next: '482913', confirmation: '482913' }), false);
  });
});

describe('pinRuleStatus', () => {
  it('marks length and pattern as the PIN is typed', () => {
    assert.deepEqual(pinRuleStatus('4829'), { lengthMet: false, patternMet: false });
    assert.deepEqual(pinRuleStatus('123456'), { lengthMet: true, patternMet: false });
    assert.deepEqual(pinRuleStatus('482913'), { lengthMet: true, patternMet: true });
  });
});
