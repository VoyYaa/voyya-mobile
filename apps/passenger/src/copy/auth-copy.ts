import { OTP_LENGTH } from '@voyyaa/shared';

export const authCopy = {
  heroTitle: 'Tu taxi, sin llamar a nadie.',
  heroAccent: 'sin llamar a nadie.',
  phoneLabel: 'Número de celular',
  phonePlaceholder: '300 123 4567',
  phoneIntro: 'Te enviaremos un código por SMS para confirmar tu número.',
  orientationLead: 'Esta app es para pedir taxi.',
  orientationBody:
    'Si eres conductor, entra desde la app de conductores. Si trabajas en una empresa, entra desde la consola web.',
  phoneInvalid: 'Ese número no parece válido. Verifica que sean 10 dígitos de un celular.',
  sendCode: 'Enviar código',
  sending: 'Enviando…',
  sendAvailable: 'Ya puedes enviar el código.',
  sendThrottled: 'Demasiadas solicitudes seguidas. Espera un momento e inténtalo de nuevo.',
  sendFailed: 'No pudimos enviar el código. Inténtalo de nuevo en un momento.',
  offlineSend: 'Sin conexión · no se puede enviar el código ahora.',
  offlineSendHint: 'Sin conexión, no se puede enviar el código ahora',
  rateLimitTitle: 'No podemos enviarte un código ahora',
  rateLimitTitleResend: 'No podemos enviarte otro código ahora',
  rateLimitWait: (remaining: string): string =>
    `Por seguridad, espera ${remaining} antes de intentarlo de nuevo.`,
  rateLimitLongBody: (hours: string): string =>
    `Por seguridad, no podemos enviar más códigos por ahora. Vuelve a intentarlo en ${hours}.`,
  rateLimitBodyGeneric:
    'Por seguridad, no podemos enviar el código ahora. Inténtalo de nuevo más tarde.',
  otpHeader: 'Verificación',
  otpSentTo: `Enviamos un código de ${OTP_LENGTH} dígitos a`,
  otpAnnounce: (maskedPhone: string): string =>
    `Código enviado a ${maskedPhone}. Ingresa los ${OTP_LENGTH} dígitos.`,
  otpVerifying: 'Verificando código…',
  otpVerifyingAnnounce: 'Verificando código.',
  otpIncorrect: 'Código incorrecto. Inténtalo de nuevo.',
  otpExpired: 'Este código venció. Solicita uno nuevo.',
  otpTooManyAttempts: 'Demasiados intentos con este código. Solicita uno nuevo.',
  otpSuspended: 'Tu acceso a VoyYa está suspendido. Un código nuevo no lo soluciona.',
  otpThrottled: 'Demasiados intentos seguidos. Espera un momento e inténtalo de nuevo.',
  otpServerError: 'No pudimos verificar tu código. Inténtalo de nuevo.',
  otpOffline: 'Sin conexión · no pudimos verificar tu código.',
  otpOfflineAnnounce: 'Sin conexión, no pudimos verificar tu código.',
  otpSuccess: 'Código verificado.',
  otpRetry: 'Reintentar',
  otpSuspendedBack: 'Volver',
  otpResend: 'Reenviar código',
  otpResending: 'Reenviando…',
  otpResendIn: (seconds: number): string => `Reenviar código en ${seconds} s`,
  otpResendInSpoken: (seconds: number): string =>
    `Reenviar código en ${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`,
  otpResendAvailable: 'Ya puedes reenviar el código.',
  otpResent: 'Código reenviado.',
} as const;
