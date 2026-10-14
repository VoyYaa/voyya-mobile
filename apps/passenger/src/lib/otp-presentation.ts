import type { MarkGlyphName, OtpInputStatus } from '@voyyaa/ui-mobile';
import { authCopy } from '../copy/auth-copy';

export type VerifyOutcome =
  | 'idle'
  | 'verifying'
  | 'incorrect'
  | 'expired'
  | 'max_attempts'
  | 'suspended'
  | 'throttled'
  | 'server'
  | 'offline'
  | 'success';

export type SendNoticeKind = 'offline' | 'server' | 'throttled';

export type MessageTone = 'danger' | 'info' | 'muted' | 'success';

export interface MessageView {
  text: string;
  tone: MessageTone;
  glyph: MarkGlyphName | null;
}

export interface VerifyView {
  inputStatus: OtpInputStatus;
  inputDisabled: boolean;
  message: MessageView | null;
  announcement: string | null;
  showRetry: boolean;
  showBack: boolean;
  clearsDigits: boolean;
  closesKeyboard: boolean;
}

const IDLE_VIEW: VerifyView = {
  inputStatus: 'editing',
  inputDisabled: false,
  message: null,
  announcement: null,
  showRetry: false,
  showBack: false,
  clearsDigits: false,
  closesKeyboard: false,
};

const DEAD_END_VIEW: VerifyView = {
  ...IDLE_VIEW,
  inputDisabled: true,
  clearsDigits: true,
  closesKeyboard: true,
};

const RETRYABLE_VIEW: VerifyView = { ...IDLE_VIEW, showRetry: true, closesKeyboard: true };

const dangerMessage = (text: string): MessageView => ({ text, tone: 'danger', glyph: 'error' });

export function verifyView(outcome: VerifyOutcome, shaking: boolean): VerifyView {
  switch (outcome) {
    case 'idle':
      return IDLE_VIEW;
    case 'verifying':
      return {
        ...IDLE_VIEW,
        inputStatus: 'verifying',
        inputDisabled: true,
        message: { text: authCopy.otpVerifying, tone: 'muted', glyph: null },
        announcement: authCopy.otpVerifyingAnnounce,
      };
    case 'incorrect':
      return {
        ...IDLE_VIEW,
        inputStatus: shaking ? 'error' : 'editing',
        message: dangerMessage(authCopy.otpIncorrect),
        announcement: authCopy.otpIncorrect,
      };
    case 'expired':
      return {
        ...DEAD_END_VIEW,
        message: dangerMessage(authCopy.otpExpired),
        announcement: authCopy.otpExpired,
      };
    case 'max_attempts':
      return {
        ...DEAD_END_VIEW,
        message: dangerMessage(authCopy.otpTooManyAttempts),
        announcement: authCopy.otpTooManyAttempts,
      };
    case 'suspended':
      return {
        ...DEAD_END_VIEW,
        showBack: true,
        message: dangerMessage(authCopy.otpSuspended),
        announcement: authCopy.otpSuspended,
      };
    case 'throttled':
      return {
        ...RETRYABLE_VIEW,
        inputDisabled: true,
        message: { text: authCopy.otpThrottled, tone: 'info', glyph: 'clock' },
        announcement: authCopy.otpThrottled,
      };
    case 'server':
      return {
        ...RETRYABLE_VIEW,
        message: dangerMessage(authCopy.otpServerError),
        announcement: authCopy.otpServerError,
      };
    case 'offline':
      return {
        ...RETRYABLE_VIEW,
        message: { text: authCopy.otpOffline, tone: 'info', glyph: 'offline' },
        announcement: authCopy.otpOfflineAnnounce,
      };
    case 'success':
      return {
        ...IDLE_VIEW,
        inputStatus: 'success',
        inputDisabled: true,
        message: { text: authCopy.otpSuccess, tone: 'success', glyph: null },
        announcement: authCopy.otpSuccess,
      };
  }
}

export function shouldClearOutcome(
  outcome: VerifyOutcome,
  shaking: boolean,
  value: string,
  submittedCode: string,
): boolean {
  switch (outcome) {
    case 'incorrect':
      return !shaking && value.length > 0;
    case 'server':
    case 'offline':
      return value !== submittedCode;
    default:
      return false;
  }
}

export function canResendCode(
  outcome: VerifyOutcome,
  waitActive: boolean,
  resendRemaining: number,
): boolean {
  if (outcome === 'suspended' || waitActive) return false;
  return outcome === 'expired' || resendRemaining <= 0;
}

export function sendNoticeView(kind: SendNoticeKind): MessageView {
  switch (kind) {
    case 'offline':
      return { text: authCopy.offlineSend, tone: 'info', glyph: 'offline' };
    case 'server':
      return dangerMessage(authCopy.sendFailed);
    case 'throttled':
      return { text: authCopy.sendThrottled, tone: 'info', glyph: 'clock' };
  }
}
