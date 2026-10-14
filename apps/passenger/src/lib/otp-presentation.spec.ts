import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { authCopy } from '../copy/auth-copy.ts';
import {
  sendNoticeView,
  shouldClearOutcome,
  verifyView,
  type VerifyOutcome,
} from './otp-presentation.ts';

const ALL_OUTCOMES: readonly VerifyOutcome[] = [
  'idle',
  'verifying',
  'incorrect',
  'expired',
  'max_attempts',
  'throttled',
  'server',
  'offline',
  'success',
];

describe('verifyView', () => {
  it('shows nothing while the person is typing', () => {
    assert.deepEqual(verifyView('idle', false), {
      inputStatus: 'editing',
      inputDisabled: false,
      message: null,
      announcement: null,
      showRetry: false,
      clearsDigits: false,
      closesKeyboard: false,
    });
  });

  it('locks the field and says it is verifying, without a glyph', () => {
    const view = verifyView('verifying', false);
    assert.equal(view.inputStatus, 'verifying');
    assert.equal(view.inputDisabled, true);
    assert.deepEqual(view.message, { text: authCopy.otpVerifying, tone: 'muted', glyph: null });
    assert.equal(view.announcement, authCopy.otpVerifyingAnnounce);
  });

  it('keeps the incorrect message and the open keyboard, and shakes only while shaking', () => {
    const shaking = verifyView('incorrect', true);
    const settled = verifyView('incorrect', false);
    assert.equal(shaking.inputStatus, 'error');
    assert.equal(settled.inputStatus, 'editing');
    for (const view of [shaking, settled]) {
      assert.deepEqual(view.message, {
        text: authCopy.otpIncorrect,
        tone: 'danger',
        glyph: 'error',
      });
      assert.equal(view.inputDisabled, false);
      assert.equal(view.closesKeyboard, false);
      assert.equal(view.showRetry, false);
      assert.equal(view.announcement, authCopy.otpIncorrect);
    }
  });

  for (const [outcome, text] of [
    ['expired', authCopy.otpExpired],
    ['max_attempts', authCopy.otpTooManyAttempts],
  ] as const) {
    it(`turns ${outcome} into a dead end: empty disabled boxes, closed keyboard, only resend`, () => {
      const view = verifyView(outcome, false);
      assert.deepEqual(view.message, { text, tone: 'danger', glyph: 'error' });
      assert.equal(view.inputStatus, 'editing');
      assert.equal(view.inputDisabled, true);
      assert.equal(view.clearsDigits, true);
      assert.equal(view.closesKeyboard, true);
      assert.equal(view.showRetry, false);
      assert.equal(view.announcement, text);
    });
  }

  it('keeps the digits of a throttled code, locks the field and offers a retry', () => {
    const view = verifyView('throttled', false);
    assert.deepEqual(view.message, { text: authCopy.otpThrottled, tone: 'info', glyph: 'clock' });
    assert.equal(view.inputDisabled, true);
    assert.equal(view.clearsDigits, false);
    assert.equal(view.closesKeyboard, true);
    assert.equal(view.showRetry, true);
  });

  it('keeps the digits of a failed service and leaves the boxes enabled, with a retry', () => {
    const view = verifyView('server', false);
    assert.deepEqual(view.message, {
      text: authCopy.otpServerError,
      tone: 'danger',
      glyph: 'error',
    });
    assert.equal(view.inputDisabled, false);
    assert.equal(view.clearsDigits, false);
    assert.equal(view.closesKeyboard, true);
    assert.equal(view.showRetry, true);
  });

  it('keeps the digits when there is no connection and announces the shorter text', () => {
    const view = verifyView('offline', false);
    assert.deepEqual(view.message, { text: authCopy.otpOffline, tone: 'info', glyph: 'offline' });
    assert.equal(view.inputDisabled, false);
    assert.equal(view.clearsDigits, false);
    assert.equal(view.closesKeyboard, true);
    assert.equal(view.showRetry, true);
    assert.equal(view.announcement, authCopy.otpOfflineAnnounce);
  });

  it('confirms the success with the mark under the boxes, not with a glyph in the message', () => {
    const view = verifyView('success', false);
    assert.equal(view.inputStatus, 'success');
    assert.equal(view.inputDisabled, true);
    assert.deepEqual(view.message, { text: authCopy.otpSuccess, tone: 'success', glyph: null });
    assert.equal(view.announcement, authCopy.otpSuccess);
  });

  it('offers a retry only where the same code can be sent again', () => {
    const withRetry = ALL_OUTCOMES.filter((outcome) => verifyView(outcome, false).showRetry);
    assert.deepEqual(withRetry, ['throttled', 'server', 'offline']);
  });

  it('closes the keyboard only in the states where typing again does not help', () => {
    const closing = ALL_OUTCOMES.filter((outcome) => verifyView(outcome, false).closesKeyboard);
    assert.deepEqual(closing, ['expired', 'max_attempts', 'throttled', 'server', 'offline']);
  });

  it('never promises a number of attempts', () => {
    for (const outcome of ALL_OUTCOMES) {
      const text = verifyView(outcome, false).message?.text ?? '';
      assert.doesNotMatch(text, /quedan|restantes|\d+ intento/i);
    }
  });
});

describe('shouldClearOutcome', () => {
  it('keeps the incorrect message while the boxes shake, even though they still hold the code', () => {
    assert.equal(shouldClearOutcome('incorrect', true, '123456', '123456'), false);
  });

  it('keeps the incorrect message after the boxes were emptied, which is when it used to vanish', () => {
    assert.equal(shouldClearOutcome('incorrect', false, '', '123456'), false);
  });

  it('clears the incorrect message with the first digit of the next try', () => {
    assert.equal(shouldClearOutcome('incorrect', false, '7', '123456'), true);
  });

  for (const outcome of ['server', 'offline'] as const) {
    it(`keeps the ${outcome} message while the code is the one that failed`, () => {
      assert.equal(shouldClearOutcome(outcome, false, '123456', '123456'), false);
    });

    it(`clears the ${outcome} message when a digit is edited`, () => {
      assert.equal(shouldClearOutcome(outcome, false, '12345', '123456'), true);
      assert.equal(shouldClearOutcome(outcome, false, '123450', '123456'), true);
    });
  }

  it('never clears the dead ends by typing, because the field is locked', () => {
    for (const outcome of [
      'expired',
      'max_attempts',
      'throttled',
      'verifying',
      'success',
    ] as const) {
      assert.equal(shouldClearOutcome(outcome, false, '1', '123456'), false);
    }
  });

  it('has nothing to clear when idle', () => {
    assert.equal(shouldClearOutcome('idle', false, '1', '123456'), false);
  });
});

describe('sendNoticeView', () => {
  it('words the three failures of sending a code, with a glyph and a tone each', () => {
    assert.deepEqual(sendNoticeView('offline'), {
      text: authCopy.offlineSend,
      tone: 'info',
      glyph: 'offline',
    });
    assert.deepEqual(sendNoticeView('server'), {
      text: authCopy.sendFailed,
      tone: 'danger',
      glyph: 'error',
    });
    assert.deepEqual(sendNoticeView('throttled'), {
      text: authCopy.sendThrottled,
      tone: 'info',
      glyph: 'clock',
    });
  });

  it('never calls a failure of the service an invalid number', () => {
    for (const kind of ['offline', 'server', 'throttled'] as const) {
      assert.notEqual(sendNoticeView(kind).text, authCopy.phoneInvalid);
    }
  });
});
