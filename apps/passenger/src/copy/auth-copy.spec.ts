import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { OTP_LENGTH } from '@voyyaa/shared';

import { authCopy } from './auth-copy.ts';

const REVEALING_WORDS =
  /conductor|empresa|personal|administrador|cuenta|usuario|registr|existe|\brol\b|autorizad|pasajero/i;
const ORIENTATION_KEYS = ['orientationLead', 'orientationBody'];

function textsOf(copy: Record<string, unknown>): Array<readonly [string, string]> {
  const sampleArguments: Record<string, unknown[]> = {
    rateLimitWait: ['4:12'],
    rateLimitLongBody: ['unas 3 horas'],
    otpAnnounce: ['+57 300 ··· ··67'],
    otpResendIn: [22],
    otpResendInSpoken: [22],
  };
  return Object.entries(copy).map(([key, value]) => {
    if (typeof value === 'string') return [key, value] as const;
    assert.equal(typeof value, 'function', key);
    const call = value as (...args: unknown[]) => string;
    return [key, call(...(sampleArguments[key] ?? []))] as const;
  });
}

const allTexts = textsOf(authCopy);

describe('auth copy takes the length of the code from the contract', () => {
  it('says six digits, built from OTP_LENGTH', () => {
    assert.equal(OTP_LENGTH, 6);
    assert.equal(authCopy.otpSentTo, `Enviamos un código de ${OTP_LENGTH} dígitos a`);
    assert.equal(
      authCopy.otpAnnounce('+57 300 ··· ··67'),
      `Código enviado a +57 300 ··· ··67. Ingresa los ${OTP_LENGTH} dígitos.`,
    );
  });

  it('writes no literal number of digits in the source of the copy', () => {
    const source = readFileSync(new URL('./auth-copy.ts', import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\b[46] dígitos/);
    assert.match(source, /\$\{OTP_LENGTH\}/);
  });
});

describe('auth copy never reveals a role or the existence of an account (HU-EO-08)', () => {
  for (const [key, text] of allTexts) {
    if (ORIENTATION_KEYS.includes(key)) continue;
    it(`keeps ${key} free of words that reveal who someone is`, () => {
      assert.doesNotMatch(text, REVEALING_WORDS, text);
    });
  }

  it('names a role only in the two fixed orientation texts, which everyone sees', () => {
    const naming = allTexts.filter(([, text]) => REVEALING_WORDS.test(text)).map(([key]) => key);
    assert.deepEqual(naming, ['orientationBody']);
  });
});

describe('auth copy orientation text (HU-EO-07)', () => {
  it('says what the app is for and where each person enters, with the default names', () => {
    assert.equal(authCopy.orientationLead, 'Esta app es para pedir taxi.');
    assert.equal(
      authCopy.orientationBody,
      'Si eres conductor, entra desde la app de conductores. Si trabajas en una empresa, entra desde la consola web.',
    );
  });

  it('does not tell anyone to download anything or name a store or an address', () => {
    const text = `${authCopy.orientationLead} ${authCopy.orientationBody}`;
    assert.doesNotMatch(text, /descarg|play store|app store|https?:|www\.|\.com/i);
  });
});

describe('auth copy does not promise what the system does not know', () => {
  for (const [key, text] of allTexts) {
    it(`keeps ${key} free of counts of attempts, clock times, delivery and autofill claims`, () => {
      assert.doesNotMatch(
        text,
        /te quedan|intentos? restantes?|último intento|\d+ intentos?/i,
        text,
      );
      assert.doesNotMatch(text, /\ba las \d|\bhasta las \d|\d{1,2}:\d{2} (am|pm)/i, text);
      assert.doesNotMatch(text, /llegará|llega en|llega enseguida|en un minuto/i, text);
      assert.doesNotMatch(text, /se rellena|pega tu código|automáticamente/i, text);
      assert.doesNotMatch(text, /vence en|venc[ei]\w* en \d/i, text);
      assert.doesNotMatch(text, /alcanzaste|límite diario|este límite/i, text);
    });
  }
});

describe('auth copy keeps the texts that the matrix of errors fixes', () => {
  it('uses the final text of every state of the code screen', () => {
    assert.equal(authCopy.otpIncorrect, 'Código incorrecto. Inténtalo de nuevo.');
    assert.equal(authCopy.otpExpired, 'Este código venció. Solicita uno nuevo.');
    assert.equal(
      authCopy.otpTooManyAttempts,
      'Demasiados intentos con este código. Solicita uno nuevo.',
    );
    assert.equal(
      authCopy.otpThrottled,
      'Demasiados intentos seguidos. Espera un momento e inténtalo de nuevo.',
    );
    assert.equal(authCopy.otpServerError, 'No pudimos verificar tu código. Inténtalo de nuevo.');
    assert.equal(authCopy.otpOffline, 'Sin conexión · no pudimos verificar tu código.');
  });

  it('uses the final text of every notice of the phone screen and of the resend', () => {
    assert.equal(
      authCopy.phoneInvalid,
      'Ese número no parece válido. Verifica que sean 10 dígitos de un celular.',
    );
    assert.equal(
      authCopy.sendThrottled,
      'Demasiadas solicitudes seguidas. Espera un momento e inténtalo de nuevo.',
    );
    assert.equal(
      authCopy.sendFailed,
      'No pudimos enviar el código. Inténtalo de nuevo en un momento.',
    );
    assert.equal(authCopy.offlineSend, 'Sin conexión · no se puede enviar el código ahora.');
    assert.equal(authCopy.sendAvailable, 'Ya puedes enviar el código.');
  });

  it('keeps one neutral title for every wait, because the server does not say which cap applies', () => {
    assert.equal(authCopy.rateLimitTitle, 'No podemos enviarte un código ahora');
    assert.equal(authCopy.rateLimitTitleResend, 'No podemos enviarte otro código ahora');
    assert.doesNotMatch(authCopy.rateLimitTitle, /pediste|varios/i);
  });

  it('words the body of the wait for each case', () => {
    assert.equal(
      authCopy.rateLimitWait('4:12'),
      'Por seguridad, espera 4:12 antes de intentarlo de nuevo.',
    );
    assert.equal(
      authCopy.rateLimitLongBody('unas 3 horas'),
      'Por seguridad, no podemos enviar más códigos por ahora. Vuelve a intentarlo en unas 3 horas.',
    );
    assert.equal(
      authCopy.rateLimitBodyGeneric,
      'Por seguridad, no podemos enviar el código ahora. Inténtalo de nuevo más tarde.',
    );
  });

  it('gives the countdown of the resend a spoken form that spells the unit', () => {
    assert.equal(authCopy.otpResendIn(22), 'Reenviar código en 22 s');
    assert.equal(authCopy.otpResendInSpoken(22), 'Reenviar código en 22 segundos');
    assert.equal(authCopy.otpResendInSpoken(1), 'Reenviar código en 1 segundo');
  });

  it('retires the keys that the new matrix replaces', () => {
    for (const retired of ['otpRateLimited', 'otpRateLimitedUnknown', 'rateLimitWaitUnknown']) {
      assert.equal(retired in authCopy, false, retired);
    }
  });
});
