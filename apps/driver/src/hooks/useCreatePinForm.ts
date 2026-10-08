import { useCallback, useEffect, useState } from 'react';
import { DRIVER_PIN_LENGTH } from '@voyyaa/shared';
import { retryInSecOf } from '@voyyaa/app-runtime';
import { classifyChangePinError } from '../auth/pin-errors';
import { isPinChangeReady, onlyDigits, validatePinChange } from '../auth/pin-rules';
import { recallTemporaryPin } from '../auth/remembered-pin';
import { usePinGateStore } from '../auth/usePinGateStore';
import { driverCopy } from '../copy/driver-copy';
import { useBlockCountdown, type BlockCountdown } from './useBlockCountdown';
import { useChangeDriverPin } from './useChangeDriverPin';

export type CreatePinOutcome = 'idle' | 'saving' | 'success' | 'expired' | 'offline' | 'server';

const SUCCESS_HOLD_MS = 900;
const CURRENT_PIN_MAX_LENGTH = 6;

export interface CreatePinForm {
  outcome: CreatePinOutcome;
  block: BlockCountdown;
  showCurrent: boolean;
  current: string;
  next: string;
  confirmation: string;
  currentError: string | undefined;
  nextError: string | undefined;
  confirmationError: string | undefined;
  ready: boolean;
  setCurrent: (raw: string) => void;
  setNext: (raw: string) => void;
  setConfirmation: (raw: string) => void;
  submit: () => void;
  finishSuccess: () => void;
}

export function useCreatePinForm(): CreatePinForm {
  const [remembered] = useState(recallTemporaryPin);
  const [forceCurrent, setForceCurrent] = useState(false);
  const [current, setCurrentValue] = useState('');
  const [next, setNextValue] = useState('');
  const [confirmation, setConfirmationValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [outcome, setOutcome] = useState<CreatePinOutcome>('idle');
  const [serverCurrentError, setServerCurrentError] = useState<string | undefined>();
  const [serverNextError, setServerNextError] = useState<string | undefined>();
  const block = useBlockCountdown();
  const change = useChangeDriverPin();

  const showCurrent = remembered === null || forceCurrent;
  const currentPin = showCurrent ? current : remembered;
  const input = { current: showCurrent ? current : remembered, next, confirmation };
  const errors = validatePinChange(input);
  const nextFull = next.length === DRIVER_PIN_LENGTH;
  const confirmationFull = confirmation.length === DRIVER_PIN_LENGTH;

  const clearFailure = useCallback((): void => {
    setOutcome((state) => (state === 'offline' || state === 'server' ? 'idle' : state));
  }, []);

  const finishSuccess = useCallback((): void => {
    usePinGateStore.getState().setCelebrating(false);
  }, []);

  useEffect(() => {
    if (outcome !== 'success') return;
    const timer = setTimeout(finishSuccess, SUCCESS_HOLD_MS);
    return () => clearTimeout(timer);
  }, [outcome, finishSuccess]);

  const submit = (): void => {
    setSubmitted(true);
    if (!isPinChangeReady(input) || currentPin === null || outcome === 'saving' || block.isBlocked)
      return;
    setOutcome('saving');
    change.mutate(
      { current_pin: currentPin, new_pin: next },
      {
        onSuccess: () => setOutcome('success'),
        onError: (error) => {
          const failure = classifyChangePinError(error);
          switch (failure.kind) {
            case 'offline':
              setOutcome('offline');
              return;
            case 'expired':
              setOutcome('expired');
              return;
            case 'blocked':
              block.startBlock(retryInSecOf(error));
              setOutcome('idle');
              return;
            case 'wrong_current':
              setForceCurrent(true);
              setServerCurrentError(driverCopy.createPin.wrongCurrent);
              setOutcome('idle');
              return;
            case 'too_weak':
              setServerNextError(driverCopy.createPin.tooWeak);
              setOutcome('idle');
              return;
            case 'invalid_data':
              if (failure.current !== undefined) {
                setForceCurrent(true);
                setServerCurrentError(failure.current);
              }
              if (failure.next !== undefined) setServerNextError(failure.next);
              setOutcome('idle');
              return;
            default:
              setOutcome('server');
          }
        },
      },
    );
  };

  return {
    outcome,
    block,
    showCurrent,
    current,
    next,
    confirmation,
    currentError: serverCurrentError ?? (submitted ? errors.current : undefined),
    nextError: serverNextError ?? (submitted || nextFull ? errors.next : undefined),
    confirmationError:
      (submitted || confirmationFull) && errors.confirmation
        ? driverCopy.createPin.mismatch
        : undefined,
    ready: isPinChangeReady(input),
    setCurrent: (raw) => {
      clearFailure();
      setServerCurrentError(undefined);
      setCurrentValue(onlyDigits(raw, CURRENT_PIN_MAX_LENGTH));
    },
    setNext: (raw) => {
      clearFailure();
      setServerNextError(undefined);
      setNextValue(onlyDigits(raw, DRIVER_PIN_LENGTH));
    },
    setConfirmation: (raw) => {
      clearFailure();
      setConfirmationValue(onlyDigits(raw, DRIVER_PIN_LENGTH));
    },
    submit,
    finishSuccess,
  };
}
