import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canRevoke, consentView, formatNoticeDate, isMailableAddress } from './privacy-status.ts';

describe('consentView', () => {
  it('maps the server state to the four rows of the privacy card', () => {
    assert.equal(consentView({ state: 'granted', requires_acceptance: false }), 'shared');
    assert.equal(consentView({ state: 'granted', requires_acceptance: true }), 'new_notice');
    assert.equal(consentView({ state: 'revoked', requires_acceptance: true }), 'revoked');
    assert.equal(consentView({ state: 'none', requires_acceptance: true }), 'none');
  });
});

describe('canRevoke', () => {
  it('offers revocation only while the server says granted', () => {
    assert.equal(canRevoke('granted'), true);
    assert.equal(canRevoke('revoked'), false);
    assert.equal(canRevoke('none'), false);
  });
});

describe('formatNoticeDate', () => {
  it('writes the date in es-CO using the Bogota day', () => {
    assert.equal(formatNoticeDate('2026-10-08T15:00:00.000Z'), '8 de octubre de 2026');
    assert.equal(formatNoticeDate('2026-10-09T03:30:00.000Z'), '8 de octubre de 2026');
  });

  it('returns null for missing or broken dates', () => {
    assert.equal(formatNoticeDate(null), null);
    assert.equal(formatNoticeDate('not a date'), null);
  });
});

describe('isMailableAddress', () => {
  it('rejects the legal placeholders and accepts real addresses', () => {
    assert.equal(isMailableAddress('[CORREO DE HABEAS DATA]'), false);
    assert.equal(isMailableAddress('privacidad@voyya.co'), true);
  });
});
