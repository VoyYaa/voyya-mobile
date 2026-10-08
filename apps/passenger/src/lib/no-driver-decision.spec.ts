import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  decideNoDriverVariant,
  retryRequestedCompanyId,
  shouldReviewFare,
} from './no-driver-decision.ts';

const NORTE = { company_id: 2, display_name: 'Transportes del Norte' };

describe('decideNoDriverVariant', () => {
  it('offers the company panel when a company was chosen and there are 2 or more', () => {
    assert.deepEqual(decideNoDriverVariant({ requestedCompany: NORTE, selectionRequired: true }), {
      kind: 'company',
      company: NORTE,
    });
  });

  it('keeps the company panel when the list could not be read', () => {
    assert.equal(
      decideNoDriverVariant({ requestedCompany: NORTE, selectionRequired: null }).kind,
      'company',
    );
  });

  it('falls back to the current panel when only one company is left', () => {
    assert.equal(
      decideNoDriverVariant({ requestedCompany: NORTE, selectionRequired: false }).kind,
      'single',
    );
  });

  it('offers the any-company panel with 2 or more companies and no choice', () => {
    assert.equal(
      decideNoDriverVariant({ requestedCompany: null, selectionRequired: true }).kind,
      'any',
    );
  });

  it('is the current panel with one company or when the list is unknown', () => {
    assert.equal(
      decideNoDriverVariant({ requestedCompany: null, selectionRequired: false }).kind,
      'single',
    );
    assert.equal(
      decideNoDriverVariant({ requestedCompany: null, selectionRequired: null }).kind,
      'single',
    );
  });
});

describe('retryRequestedCompanyId', () => {
  it('repeats the chosen company on same', () => {
    assert.equal(retryRequestedCompanyId('same', NORTE), 2);
    assert.equal(retryRequestedCompanyId('same', null), undefined);
  });

  it('drops the preference on any', () => {
    assert.equal(retryRequestedCompanyId('any', NORTE), undefined);
  });
});

describe('shouldReviewFare', () => {
  it('asks for review only when searching any company and the total changed', () => {
    assert.equal(shouldReviewFare('any', 8000, 9000), true);
    assert.equal(shouldReviewFare('any', 8000, 8000), false);
    assert.equal(shouldReviewFare('any', null, 9000), false);
    assert.equal(shouldReviewFare('same', 8000, 9000), false);
  });
});
