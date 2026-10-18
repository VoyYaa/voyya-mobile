import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ConsentStatus } from '@voyyaa/shared';

import {
  consentGatePhase,
  freshConsentStatus,
  noticeToastVisible,
  phaseOfStatus,
} from './consent-phase.ts';

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

describe('freshConsentStatus (CS-14)', () => {
  const granted = status({ state: 'granted', requires_acceptance: false });

  it('keeps an answer obtained in this session', () => {
    assert.equal(freshConsentStatus(granted, 2000, 1000), granted);
    assert.equal(freshConsentStatus(granted, 1000, 1000), granted);
  });

  it('drops an answer obtained before this session started, which is the one of the previous user', () => {
    assert.equal(freshConsentStatus(granted, 999, 1000), null);
  });

  it('drops everything without a session or without an answer', () => {
    assert.equal(freshConsentStatus(granted, 2000, null), null);
    assert.equal(freshConsentStatus(undefined, 2000, 1000), null);
    assert.equal(freshConsentStatus(granted, 0, 1000), null);
  });
});

describe('consentGatePhase (CS-14)', () => {
  const granted = status({ state: 'granted', requires_acceptance: false });
  const idle = { status: null, localConfirmed: false, failed: false, offline: false };

  it('follows the fresh answer of the server', () => {
    assert.equal(consentGatePhase({ ...idle, status: granted }), 'confirmed');
    assert.equal(consentGatePhase({ ...idle, status: status({ state: 'none' }) }), 'needs_notice');
    assert.equal(consentGatePhase({ ...idle, status: status({ state: 'revoked' }) }), 'declined');
  });

  it('waits while it still reads the own confirmation', () => {
    assert.equal(consentGatePhase({ ...idle, localConfirmed: null }), 'checking');
  });

  it('trusts the own confirmation of this user when the server has not answered', () => {
    assert.equal(consentGatePhase({ ...idle, localConfirmed: true, failed: true }), 'confirmed');
  });

  it('fails closed: with no fresh answer and no own confirmation, a failing server is unknown, never confirmed', () => {
    assert.equal(consentGatePhase({ ...idle, failed: true }), 'unknown');
    assert.equal(consentGatePhase({ ...idle, offline: true }), 'unknown');
  });

  it('keeps asking while the server has not failed yet', () => {
    assert.equal(consentGatePhase(idle), 'checking');
  });

  it('never confirms the next user with the answer of the previous one left in the cache', () => {
    const leftByPrevious = freshConsentStatus(granted, 500, 1000);
    const phase = consentGatePhase({ ...idle, status: leftByPrevious, failed: true });
    assert.equal(phase, 'unknown');
    assert.notEqual(phase, 'confirmed');
  });
});

describe('noticeToastVisible (D-CS-08)', () => {
  const ready = { pending: true, sheetOpen: false, phase: 'unknown' } as const;

  it('shows a pending notice once nothing covers the screen', () => {
    assert.equal(noticeToastVisible(ready), true);
    assert.equal(noticeToastVisible({ ...ready, phase: 'needs_notice' }), true);
    assert.equal(noticeToastVisible({ ...ready, phase: 'confirmed' }), true);
  });

  it('holds the notice while the location sheet is open, because the sheet is drawn above it', () => {
    assert.equal(noticeToastVisible({ ...ready, sheetOpen: true }), false);
  });

  it('holds the notice while the consent phase is still being decided, because the sheet may open next', () => {
    assert.equal(noticeToastVisible({ ...ready, phase: 'checking' }), false);
  });

  it('shows nothing when no notice is pending', () => {
    assert.equal(noticeToastVisible({ ...ready, pending: false }), false);
  });
});
