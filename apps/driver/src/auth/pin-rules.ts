import {
  ChangeDriverPinDTO,
  DRIVER_PIN_LENGTH,
  NewDriverPin,
  Pin,
  isWeakDriverPin,
} from '@voyyaa/shared';

export interface PinChangeInput {
  current: string | null;
  next: string;
  confirmation: string;
}

export interface PinChangeErrors {
  current?: string;
  next?: string;
  confirmation?: 'mismatch';
}

export interface PinRuleStatus {
  lengthMet: boolean;
  patternMet: boolean;
}

export function onlyDigits(raw: string, maxLength: number): string {
  return raw.replace(/\D/g, '').slice(0, maxLength);
}

export function validatePinChange({
  current,
  next,
  confirmation,
}: PinChangeInput): PinChangeErrors {
  const errors: PinChangeErrors = {};

  const nextResult = NewDriverPin.safeParse(next);
  if (!nextResult.success) errors.next = nextResult.error.issues[0]?.message;

  if (current !== null) {
    const currentResult = Pin.safeParse(current);
    if (!currentResult.success) errors.current = currentResult.error.issues[0]?.message;

    const pairResult = ChangeDriverPinDTO.safeParse({ current_pin: current, new_pin: next });
    if (!pairResult.success) {
      const sameAsCurrent = pairResult.error.issues.find((issue) => issue.path[0] === 'new_pin');
      if (sameAsCurrent) errors.next ??= sameAsCurrent.message;
    }
  }

  if (errors.next === undefined && confirmation !== next) errors.confirmation = 'mismatch';

  return errors;
}

export function isPinChangeReady(input: PinChangeInput): boolean {
  return (
    input.next.length === DRIVER_PIN_LENGTH &&
    input.confirmation.length === DRIVER_PIN_LENGTH &&
    Object.keys(validatePinChange(input)).length === 0
  );
}

export function pinRuleStatus(next: string): PinRuleStatus {
  const lengthMet = /^\d+$/.test(next) && next.length === DRIVER_PIN_LENGTH;
  return { lengthMet, patternMet: lengthMet && !isWeakDriverPin(next) };
}
