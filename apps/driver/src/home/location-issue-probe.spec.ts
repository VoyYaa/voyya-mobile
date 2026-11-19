import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { nextLocationIssue } from './location-issue-probe.ts';

describe('nextLocationIssue', () => {
  it('flags a denied permission before anything else', () => {
    assert.equal(
      nextLocationIssue(null, { permission: 'denied', servicesEnabled: false }),
      'permission_denied',
    );
  });

  it('flags an off GPS', () => {
    assert.equal(
      nextLocationIssue(null, { permission: 'allowed', servicesEnabled: false }),
      'gps_disabled',
    );
  });

  it('clears a system issue once permission and GPS are back', () => {
    assert.equal(
      nextLocationIssue('permission_denied', { permission: 'allowed', servicesEnabled: true }),
      null,
    );
    assert.equal(
      nextLocationIssue('gps_disabled', { permission: 'allowed', servicesEnabled: true }),
      null,
    );
  });

  it('keeps the current issue when the probe is inconclusive', () => {
    assert.equal(
      nextLocationIssue('gps_disabled', { permission: 'unknown', servicesEnabled: null }),
      'gps_disabled',
    );
    assert.equal(
      nextLocationIssue('gps_disabled', { permission: 'allowed', servicesEnabled: null }),
      'gps_disabled',
    );
  });

  it('never clears a consent issue by itself', () => {
    assert.equal(
      nextLocationIssue('consent_required', { permission: 'allowed', servicesEnabled: true }),
      'consent_required',
    );
  });

  it('leaves a healthy system without issue', () => {
    assert.equal(nextLocationIssue(null, { permission: 'allowed', servicesEnabled: true }), null);
  });
});
