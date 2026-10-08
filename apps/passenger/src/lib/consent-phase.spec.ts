import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ConsentStatus } from '@voyyaa/shared';

import { phaseOfStatus } from './consent-phase.ts';

function status(overrides: Partial<ConsentStatus>): ConsentStatus {
  return {
    purpose: 'location',
    state: 'none',
    notice_version: null,
    granted_at: null,
    revoked_at: null,
    current_notice_version: 'location-notice-v2',
    requires_acceptance: true,
    ...overrides,
  };
}

describe('phaseOfStatus', () => {
  it('confirms a granted consent on the current notice', () => {
    const granted = status({ state: 'granted', requires_acceptance: false });
    assert.equal(phaseOfStatus(granted), 'confirmed');
  });

  it('asks again when the granted notice is outdated', () => {
    const outdated = status({ state: 'granted', requires_acceptance: true });
    assert.equal(phaseOfStatus(outdated), 'needs_notice');
  });

  it('asks when nothing was accepted yet', () => {
    assert.equal(phaseOfStatus(status({ state: 'none' })), 'needs_notice');
  });

  it('does not nag a passenger who revoked', () => {
    assert.equal(phaseOfStatus(status({ state: 'revoked' })), 'declined');
  });
});
