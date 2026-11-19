import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AUTH_STAGE_CONTENT_MIN_DP, authStageMinHeight } from './auth-stage.ts';

describe('authStageMinHeight', () => {
  it('keeps room for the logo and the headline below the status bar', () => {
    assert.equal(authStageMinHeight(24), 24 + AUTH_STAGE_CONTENT_MIN_DP);
  });

  it('ignores a negative inset', () => {
    assert.equal(authStageMinHeight(-5), AUTH_STAGE_CONTENT_MIN_DP);
  });
});
