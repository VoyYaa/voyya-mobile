export interface OtpBlockHistory {
  blocked: boolean;
  resentSinceBlock: boolean;
}

export const EMPTY_OTP_BLOCK_HISTORY: OtpBlockHistory = {
  blocked: false,
  resentSinceBlock: false,
};

export function recordOtpBlock(history: OtpBlockHistory): {
  next: OtpBlockHistory;
  repeated: boolean;
} {
  return {
    next: { blocked: true, resentSinceBlock: false },
    repeated: history.blocked && history.resentSinceBlock,
  };
}

export function recordOtpResend(history: OtpBlockHistory): OtpBlockHistory {
  return { ...history, resentSinceBlock: history.blocked };
}
