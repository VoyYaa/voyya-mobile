import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isLocationConsentRequiredError } from './consent-errors.ts';

describe('isLocationConsentRequiredError', () => {
  it('recognizes 403 LOCATION_CONSENT_REQUIRED', () => {
    assert.equal(
      isLocationConsentRequiredError({ status: 403, code: 'LOCATION_CONSENT_REQUIRED' }),
      true,
    );
  });

  it('ignores other codes, other statuses and non-objects', () => {
    assert.equal(isLocationConsentRequiredError({ status: 403, code: 'NOT_ON_SHIFT' }), false);
    assert.equal(
      isLocationConsentRequiredError({ status: 500, code: 'LOCATION_CONSENT_REQUIRED' }),
      false,
    );
    assert.equal(isLocationConsentRequiredError(null), false);
    assert.equal(isLocationConsentRequiredError('LOCATION_CONSENT_REQUIRED'), false);
  });
});
