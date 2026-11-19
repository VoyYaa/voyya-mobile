import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  sharingDisplayKind,
  showIosForegroundNote,
  showNotificationsOff,
} from './demo-sharing-view.ts';
import { deriveSharingIndicator, type SharingIndicator } from './sharing-machine.ts';

const SHARING = { trip_request_id: 4, interval_sec: 15 };

describe('sharingDisplayKind in a real session (CA-DX-1)', () => {
  const kinds: SharingIndicator[] = [
    { kind: 'none' },
    { kind: 'consent_required' },
    { kind: 'location_issue', issue: 'permission_denied' },
    { kind: 'location_issue', issue: 'gps_disabled' },
    { kind: 'precise_needed' },
    { kind: 'no_fix' },
    { kind: 'offline' },
    { kind: 'capped' },
    { kind: 'active' },
  ];

  for (const indicator of kinds) {
    it(`shows ${indicator.kind} as it is`, () => {
      assert.equal(sharingDisplayKind(indicator, false), indicator.kind);
    });
  }
});

describe('sharingDisplayKind in a demo session (CA-DX-18)', () => {
  it('turns every device warning into the plain demo badge', () => {
    for (const indicator of [
      { kind: 'location_issue', issue: 'permission_denied' },
      { kind: 'location_issue', issue: 'gps_disabled' },
      { kind: 'precise_needed' },
      { kind: 'no_fix' },
      { kind: 'active' },
    ] as const) {
      assert.equal(sharingDisplayKind(indicator, true), 'demo_active', indicator.kind);
    }
  });

  it('keeps what is real: a pending notice, no connection, a reached cap and nothing to show', () => {
    for (const kind of ['consent_required', 'offline', 'capped', 'none'] as const) {
      assert.equal(sharingDisplayKind({ kind }, true), kind);
    }
  });

  it('never shows a device warning even when the machine derives one from a stale issue', () => {
    const indicator = deriveSharingIndicator({
      status: 'running',
      sharing: SHARING,
      locationIssue: 'permission_denied',
      silentForSec: 0,
      offline: false,
    });
    assert.equal(sharingDisplayKind(indicator, true), 'demo_active');
  });
});

describe('showNotificationsOff', () => {
  it('hides the notifications warning in a demo session only', () => {
    assert.equal(showNotificationsOff(true, true), false);
    assert.equal(showNotificationsOff(true, false), true);
    assert.equal(showNotificationsOff(false, false), false);
  });
});

describe('showIosForegroundNote', () => {
  it('keeps the note for an iPhone in the real and in the demo badge', () => {
    assert.equal(showIosForegroundNote(true, 'active', true), true);
    assert.equal(showIosForegroundNote(false, 'demo_active', true), true);
  });

  it('does not show it on Android or without sharing', () => {
    assert.equal(showIosForegroundNote(false, 'demo_active', false), false);
    assert.equal(showIosForegroundNote(false, 'none', true), false);
  });
});
