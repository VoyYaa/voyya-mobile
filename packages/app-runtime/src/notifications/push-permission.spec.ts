import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canRequestPushPermission,
  derivePushPermission,
  toPermissionSnapshot,
} from './push-permission.ts';

describe('derivePushPermission', () => {
  const asked = { channelEnabled: true, askedBefore: true };

  it('is granted when the system allows notifications and the channel is on', () => {
    assert.equal(derivePushPermission({ status: 'granted', canAskAgain: false }, asked), 'granted');
  });

  it('is blocked when the permission is granted but the channel is switched off', () => {
    assert.equal(
      derivePushPermission(
        { status: 'granted', canAskAgain: false },
        { channelEnabled: false, askedBefore: true },
      ),
      'blocked',
    );
  });

  it('is undetermined before the system dialog was ever answered', () => {
    assert.equal(
      derivePushPermission({ status: 'undetermined', canAskAgain: true }, asked),
      'undetermined',
    );
  });

  it('is askable after one denial while the system still allows asking', () => {
    assert.equal(derivePushPermission({ status: 'denied', canAskAgain: true }, asked), 'askable');
  });

  it('is blocked after a denial the system will not ask about again', () => {
    assert.equal(derivePushPermission({ status: 'denied', canAskAgain: false }, asked), 'blocked');
    assert.equal(
      derivePushPermission(
        { status: 'denied', canAskAgain: false },
        { channelEnabled: true, askedBefore: false },
      ),
      'blocked',
    );
  });

  it('reads a denial the app never provoked as undetermined, as Android 13 may report a fresh install', () => {
    assert.equal(
      derivePushPermission(
        { status: 'denied', canAskAgain: true },
        { channelEnabled: true, askedBefore: false },
      ),
      'undetermined',
    );
  });
});

describe('canRequestPushPermission', () => {
  it('only allows asking when the dialog can still appear', () => {
    assert.equal(canRequestPushPermission('undetermined'), true);
    assert.equal(canRequestPushPermission('askable'), true);
    assert.equal(canRequestPushPermission('blocked'), false);
    assert.equal(canRequestPushPermission('granted'), false);
    assert.equal(canRequestPushPermission('unsupported'), false);
  });
});

describe('toPermissionSnapshot', () => {
  it('maps a granted permission', () => {
    assert.deepEqual(
      toPermissionSnapshot({ status: 'granted', canAskAgain: true, granted: true }),
      {
        status: 'granted',
        canAskAgain: true,
      },
    );
  });

  it('maps an unanswered permission as one the system can still ask about', () => {
    assert.deepEqual(
      toPermissionSnapshot({ status: 'undetermined', canAskAgain: true, granted: false }),
      { status: 'undetermined', canAskAgain: true },
    );
  });

  it('keeps the system answer after a denial', () => {
    assert.deepEqual(
      toPermissionSnapshot({ status: 'denied', canAskAgain: true, granted: false }),
      {
        status: 'denied',
        canAskAgain: true,
      },
    );
    assert.deepEqual(
      toPermissionSnapshot({ status: 'denied', canAskAgain: false, granted: false }),
      {
        status: 'denied',
        canAskAgain: false,
      },
    );
  });

  it('never offers to ask when the permission is granted but notifications are off in Settings', () => {
    const snapshot = toPermissionSnapshot({ status: 'denied', canAskAgain: true, granted: true });
    assert.deepEqual(snapshot, { status: 'denied', canAskAgain: false });
    assert.equal(derivePushPermission(snapshot, true), 'blocked');
  });

  it('reads any status it does not know as unanswered', () => {
    assert.equal(
      toPermissionSnapshot({ status: 'provisional', canAskAgain: true, granted: false }).status,
      'undetermined',
    );
  });
});
