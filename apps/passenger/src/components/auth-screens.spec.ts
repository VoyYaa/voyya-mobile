import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

const otp = source('../../app/(auth)/otp.tsx');
const phone = source('../../app/(auth)/phone.tsx');
const waitCard = source('./WaitCard.tsx');
const authMessage = source('./AuthMessage.tsx');
const waitHook = source('../hooks/useWaitDeadline.ts');

describe('both auth screens', () => {
  for (const [name, text] of [
    ['otp', otp],
    ['phone', phone],
  ] as const) {
    it(`${name} writes nothing to the console, because LogBox would cover the main button`, () => {
      assert.doesNotMatch(text, /console\./);
    });

    it(`${name} decides what failed with the classifier and never with the message`, () => {
      assert.match(text, /classifyOtpFailure\(error, '(verify|request)'\)/);
      assert.doesNotMatch(text, /error\.message/);
      assert.doesNotMatch(text, /domainErrorCode|isNetworkError/);
    });

    it(`${name} has no literal color`, () => {
      assert.doesNotMatch(text, /#[0-9a-fA-F]{3,8}\b/);
    });

    it(`${name} has no literal length of the code`, () => {
      assert.doesNotMatch(text, /\b[46] dígitos/);
      assert.doesNotMatch(text, /length=\{[0-9]+\}/);
    });
  }
});

describe('code screen', () => {
  it('asks for the length of the contract, not for a literal', () => {
    assert.match(otp, /length=\{OTP_LENGTH\}/);
    assert.match(otp, /import \{ OTP_LENGTH, type SessionResponse \} from '@voyyaa\/shared'/);
  });

  it('classifies verifying and resending with their own column of the matrix', () => {
    assert.match(otp, /classifyOtpFailure\(error, 'verify'\)/);
    assert.match(otp, /classifyOtpFailure\(error, 'request'\)/);
  });

  it('keeps the message after the boxes empty, and stops shaking when the input says so', () => {
    assert.match(otp, /onErrorSettled=\{\(\) => setShaking\(false\)\}/);
    assert.match(otp, /shouldClearOutcome\(outcome, shaking, value, submittedCode\.current\)/);
  });

  it('closes the keyboard in the states where typing again does not help', () => {
    assert.match(otp, /if \(view\.closesKeyboard\) Keyboard\.dismiss\(\)/);
  });

  it('empties the boxes when the code expired, ran out of attempts or was spent on a suspension', () => {
    assert.match(
      otp,
      /case 'expired':\s+case 'max_attempts':\s+case 'suspended':\s+setValue\(''\);\s+setOutcome\(failure\.kind\);/,
    );
  });

  it('does nothing else after a suspension: no request, no navigation, no timer', () => {
    const branch = otp.slice(otp.indexOf("case 'expired':"), otp.indexOf("case 'throttled':"));
    assert.match(branch, /case 'suspended':/);
    assert.doesNotMatch(branch, /router|\.mutate\(|setTimeout|verifyThrottle|rateLimit|Resend/);
  });

  it('takes the right to resend from the pure rule, which a suspension never satisfies', () => {
    assert.match(
      otp,
      /const canResend = canResendCode\(outcome, rateLimit\.active, resendRemaining\);/,
    );
    assert.doesNotMatch(otp, /const canResend = !rateLimit\.active/);
  });

  it('does not draw the resend area while verifying, after success or after a suspension', () => {
    assert.match(
      otp,
      /\{outcome !== 'verifying' && outcome !== 'success' && outcome !== 'suspended' && \(\s+<Reveal index=\{2\}>/,
    );
  });

  it('offers a single way out after a suspension: a 52 dp ghost button that goes back like the header arrow', () => {
    assert.match(
      otp,
      /\{view\.showBack && \(\s+<Button\s+label=\{copy\.otpSuspendedBack\}\s+variant="ghost"\s+onPress=\{handleBack\}\s+testID="back-from-suspended-button"\s+\/>\s+\)\}/,
    );
    assert.match(otp, /const handleBack = \(\): void => router\.back\(\);/);
    assert.match(otp, /<ScreenHeader title=\{copy\.otpHeader\} onBack=\{handleBack\} \/>/);
  });

  it('moves no focus by code and adds no second announcer for the suspension', () => {
    assert.doesNotMatch(otp, /accessibilityLiveRegion/);
    assert.doesNotMatch(otp, /accessibilityRole="alert"/);
    assert.equal(
      otp.match(/AccessibilityInfo\.announceForAccessibility\(view\.announcement\)/g)?.length,
      1,
    );
    assert.equal(otp.match(/setFocusRequest\(/g)?.length, 1);
  });

  it('focuses the field again after a successful resend, once the boxes are enabled', () => {
    assert.match(otp, /setFocusRequest\(\(count\) => count \+ 1\)/);
    assert.match(otp, /if \(focusRequest > 0\) otpRef\.current\?\.focus\(\)/);
    assert.match(otp, /ref=\{otpRef\}/);
  });

  it('tells the person when a resend fails, in its own space and announced once', () => {
    assert.match(otp, /setResendNotice\(failure\.kind\)/);
    assert.match(
      otp,
      /<AuthMessage message=\{sendNoticeView\(notice\)\} testID="resend-notice" \/>/,
    );
    assert.match(otp, /announceForAccessibility\(sendNoticeView\(resendNotice\)\.text\)/);
  });

  it('shows the shared wait card for a resend, with the title of the second code', () => {
    assert.match(otp, /<WaitCard\s+title=\{copy\.rateLimitTitleResend\}/);
  });

  it('gives the countdown of the resend a spoken label and no live region', () => {
    assert.match(otp, /accessibilityLabel=\{copy\.otpResendInSpoken\(resendRemaining\)\}/);
    assert.doesNotMatch(otp, /accessibilityLiveRegion/);
  });

  it('offers the retry as a 52 dp button and only through the view of the state', () => {
    assert.match(
      otp,
      /\{view\.showRetry && \(\s+<Button\s+label=\{copy\.otpRetry\}\s+variant="ghost"/,
    );
    assert.doesNotMatch(otp, /<Button[^>]*size="sm"/);
  });

  it('reserves two lines for the message, from the token of the typography', () => {
    assert.match(otp, /MESSAGE_LINES = 2/);
    assert.match(otp, /theme\.typography\.smallStrong\.lineHeight/);
    assert.match(otp, /minHeight: messageHeight/);
  });

  it('announces each state once through the screen reader, not through a role that repeats it', () => {
    assert.match(otp, /AccessibilityInfo\.announceForAccessibility\(view\.announcement\)/);
    assert.doesNotMatch(otp, /accessibilityRole="alert"/);
  });
});

describe('phone screen', () => {
  it('shows "invalid number" only for the response that says the data is invalid', () => {
    assert.equal(phone.match(/copy\.phoneInvalid/g)?.length, 1);
    assert.match(phone, /case 'invalid_phone':\s+setFieldError\(copy\.phoneInvalid\);/);
  });

  it('puts the orientation text right under the intro and before the field', () => {
    const intro = phone.indexOf('copy.phoneIntro');
    const lead = phone.indexOf('copy.orientationLead');
    const body = phone.indexOf('copy.orientationBody');
    const field = phone.indexOf('<TextField');
    assert.ok(intro > 0 && intro < lead && lead < body && body < field);
  });

  it('styles the orientation as plain information: a strong first sentence, no card, no error color', () => {
    const block = phone.slice(
      phone.indexOf('testID="phone-orientation"'),
      phone.indexOf('<TextField'),
    );
    assert.match(block, /theme\.typography\.smallStrong/);
    assert.match(block, /theme\.typography\.small,/);
    assert.doesNotMatch(block, /dangerInk|<Card|MarkGlyph/);
  });

  it('keeps the field editable while a wait lasts, so a mistyped number is not stuck', () => {
    assert.match(phone, /disabled=\{requestOtp\.isPending\}/);
    assert.match(phone, /wait\.clear\(\);/);
  });

  it('replaces the button with the shared wait card, with the neutral title', () => {
    assert.match(phone, /<WaitCard\s+title=\{copy\.rateLimitTitle\}/);
  });

  it('announces that sending is possible again when a wait ends', () => {
    assert.match(phone, /announceForAccessibility\(copy\.sendAvailable\)/);
  });

  it('shows one notice at a time under the button, from the view of the notice', () => {
    assert.match(phone, /<AuthMessage message=\{sendNoticeView\(visibleNotice\)\} alert/);
  });

  it('does not add a second retry button, because the main action is already "Enviar código"', () => {
    assert.doesNotMatch(phone, /otpRetry/);
  });

  it('disables the button while the device is offline or the limiter by IP asks to wait', () => {
    assert.match(phone, /disabled=\{!isFormatValid \|\| offline \|\| throttle\.active\}/);
  });
});

describe('WaitCard', () => {
  it('is one accessible element whose label is the title and the spoken wait', () => {
    assert.match(waitCard, /accessible\s+accessibilityLabel=\{label\}/);
    assert.match(waitCard, /const label = `\$\{title\}\. \$\{text\.spokenBody\}`/);
  });

  it('is not a live region and has no alert role, so it never announces every second', () => {
    assert.doesNotMatch(waitCard, /accessibilityRole="alert"/);
    assert.doesNotMatch(waitCard, /accessibilityLiveRegion/);
  });

  it('announces itself once, when it appears', () => {
    assert.match(
      waitCard,
      /useEffect\(\(\) => \{\s+AccessibilityInfo\.announceForAccessibility\(label\);\s+\}, \[\]\);/,
    );
  });

  it('formats the clock only through the pure function, which never gives "1440:00"', () => {
    assert.match(waitCard, /waitCardText\(timeKnown \? remainingSec : null, formatMMSS\)/);
    assert.equal(waitCard.match(/formatMMSS\(/g), null);
  });

  it('is built on the tint card with the clock glyph and tokens only', () => {
    assert.match(waitCard, /<Card tone="tint"/);
    assert.match(waitCard, /glyph="clock"/);
    assert.doesNotMatch(waitCard, /#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('AuthMessage', () => {
  it('colors by tone from the tokens, with a glyph and text so color is never the only signal', () => {
    assert.match(authMessage, /dangerInk/);
    assert.match(authMessage, /infoInk/);
    assert.match(authMessage, /successInk/);
    assert.match(authMessage, /<MarkGlyph glyph=\{message\.glyph\}/);
    assert.doesNotMatch(authMessage, /#[0-9a-fA-F]{3,8}\b/);
  });

  it('lets the long texts wrap instead of cutting them', () => {
    assert.match(authMessage, /flexShrink: 1/);
    assert.doesNotMatch(authMessage, /numberOfLines/);
  });
});

describe('useWaitDeadline', () => {
  it('takes the fallback of a wait without a known time from the constants', () => {
    assert.match(waitHook, /RATE_LIMIT_FALLBACK_SEC/);
  });

  it('does not announce nor call back when the wait is cleared by hand', () => {
    assert.match(
      waitHook,
      /const clear = useCallback\(\(\): void => \{\s+seenActive\.current = false;/,
    );
  });
});
