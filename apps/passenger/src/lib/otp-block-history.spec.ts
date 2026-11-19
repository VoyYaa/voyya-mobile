import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EMPTY_OTP_BLOCK_HISTORY, recordOtpBlock, recordOtpResend } from './otp-block-history.ts';

describe('otp block history', () => {
  it('is not a repeat the first time the code is blocked', () => {
    assert.equal(recordOtpBlock(EMPTY_OTP_BLOCK_HISTORY).repeated, false);
  });

  it('is a repeat when it is blocked again after a resend on the same screen', () => {
    const first = recordOtpBlock(EMPTY_OTP_BLOCK_HISTORY).next;
    const resent = recordOtpResend(first);
    assert.equal(recordOtpBlock(resent).repeated, true);
  });

  it('is not a repeat if nothing was resent between the two blocks', () => {
    const first = recordOtpBlock(EMPTY_OTP_BLOCK_HISTORY).next;
    assert.equal(recordOtpBlock(first).repeated, false);
  });

  it('ignores a resend that happened before any block', () => {
    const resent = recordOtpResend(EMPTY_OTP_BLOCK_HISTORY);
    assert.equal(resent.resentSinceBlock, false);
    assert.equal(recordOtpBlock(resent).repeated, false);
  });

  it('starts counting again after each block', () => {
    const first = recordOtpBlock(EMPTY_OTP_BLOCK_HISTORY).next;
    const second = recordOtpBlock(recordOtpResend(first)).next;
    assert.equal(recordOtpBlock(second).repeated, false);
    assert.equal(recordOtpBlock(recordOtpResend(second)).repeated, true);
  });
});
