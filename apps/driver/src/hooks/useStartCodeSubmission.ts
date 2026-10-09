import { useCallback, useEffect, useRef, useState } from 'react';
import { START_CODE_LENGTH, START_CODE_MAX_FAILED_ATTEMPTS } from '@voyyaa/shared';
import { useQueryClient } from '@tanstack/react-query';
import { getDriverHome } from '../api/driver.api';
import { dispatchSharing } from '../tracking/sharing-runtime';
import {
  classifyStartFailure,
  resolveUncertainStart,
  startSheetView,
  type StartFailure,
  type StartSheetPhase,
  type StartSheetView,
} from '../trip/start-code-flow';
import { DRIVER_HOME_QUERY_KEY } from './useDriverHome';
import { useBestEffortLocationReport } from './useReportLocation';
import { useStartTrip } from './useTripActions';

const SHAKE_MS = 650;
const SUCCESS_CLOSE_MS = 600;
const MS_PER_SEC = 1000;

export interface StartCodeSubmissionOptions {
  tripRequestId: number | null;
  attemptsRemaining: number | null;
  online: boolean;
  onStarted: () => void;
  onBlocked: () => void;
  onChanged: () => void;
}

export interface StartCodeSubmission {
  view: StartSheetView;
  digits: string;
  setDigits: (digits: string) => void;
  submit: () => void;
  reset: () => void;
}

export function useStartCodeSubmission({
  tripRequestId,
  attemptsRemaining,
  online,
  onStarted,
  onBlocked,
  onChanged,
}: StartCodeSubmissionOptions): StartCodeSubmission {
  const queryClient = useQueryClient();
  const start = useStartTrip(tripRequestId);
  const reportLocationBestEffort = useBestEffortLocationReport();
  const [digits, setDigits] = useState('');
  const [phase, setPhase] = useState<StartSheetPhase>('editing');
  const [failure, setFailure] = useState<StartFailure | null>(null);
  const [errorShake, setErrorShake] = useState(false);
  const [override, setOverride] = useState<number | null>(null);
  const [rateUntil, setRateUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const callbacks = useRef({ onStarted, onBlocked, onChanged });
  callbacks.current = { onStarted, onBlocked, onChanged };

  useEffect(() => setOverride(null), [attemptsRemaining]);

  useEffect(() => {
    if (rateUntil === null) return;
    const interval = setInterval(() => setNow(Date.now()), MS_PER_SEC);
    return () => clearInterval(interval);
  }, [rateUntil]);

  const rateLimitedForSec =
    rateUntil === null ? 0 : Math.max(0, Math.ceil((rateUntil - now) / MS_PER_SEC));
  const effectiveAttempts = override ?? attemptsRemaining;

  useEffect(() => {
    if (rateUntil === null || rateLimitedForSec > 0) return;
    setRateUntil(null);
    setFailure(null);
  }, [rateUntil, rateLimitedForSec]);

  const view = startSheetView({
    digits,
    length: START_CODE_LENGTH,
    maxAttempts: START_CODE_MAX_FAILED_ATTEMPTS,
    phase,
    failure,
    errorShake,
    attemptsRemaining: effectiveAttempts,
    online,
    rateLimitedForSec,
  });

  const refreshHome = useCallback((): void => {
    void queryClient.invalidateQueries({ queryKey: DRIVER_HOME_QUERY_KEY });
  }, [queryClient]);

  const shake = useCallback((): void => {
    setErrorShake(true);
    setTimeout(() => setErrorShake(false), SHAKE_MS);
  }, []);

  const finishStarted = useCallback((): void => {
    setPhase('success');
    dispatchSharing({ type: 'trip_started' });
    reportLocationBestEffort();
    setTimeout(() => callbacks.current.onStarted(), SUCCESS_CLOSE_MS);
  }, [reportLocationBestEffort]);

  const showInvalid = useCallback(
    (remaining: number | null): void => {
      setPhase('editing');
      setFailure({ kind: 'invalid', attemptsRemaining: remaining });
      if (remaining !== null) setOverride(remaining);
      shake();
      refreshHome();
    },
    [refreshHome, shake],
  );

  const recheckAfterUncertainResponse = useCallback(async (): Promise<void> => {
    setPhase('checking');
    const before = { attemptsRemaining: effectiveAttempts };
    try {
      const fresh = await getDriverHome();
      queryClient.setQueryData(DRIVER_HOME_QUERY_KEY, fresh);
      const trip = fresh.active_trip;
      if (trip === null) {
        callbacks.current.onChanged();
        return;
      }
      const resolution = resolveUncertainStart(before, trip);
      if (resolution.kind === 'started') finishStarted();
      else if (resolution.kind === 'blocked') callbacks.current.onBlocked();
      else if (resolution.kind === 'invalid') showInvalid(resolution.attemptsRemaining);
      else {
        setPhase('editing');
        setFailure({ kind: 'not_sent' });
      }
    } catch {
      setPhase('editing');
      setFailure({ kind: 'not_sent' });
    }
  }, [effectiveAttempts, finishStarted, queryClient, showInvalid]);

  const handleFailure = useCallback(
    (error: unknown): void => {
      const classified = classifyStartFailure(error);
      switch (classified.kind) {
        case 'invalid':
          showInvalid(classified.attemptsRemaining);
          return;
        case 'blocked':
          refreshHome();
          callbacks.current.onBlocked();
          return;
        case 'changed':
          refreshHome();
          callbacks.current.onChanged();
          return;
        case 'rate_limited':
          setPhase('editing');
          setFailure(classified);
          setNow(Date.now());
          setRateUntil(Date.now() + classified.waitSec * MS_PER_SEC);
          return;
        case 'uncertain':
          void recheckAfterUncertainResponse();
          return;
        default:
          setPhase('editing');
          setFailure(classified);
      }
    },
    [recheckAfterUncertainResponse, refreshHome, showInvalid],
  );

  const submit = useCallback((): void => {
    if (!view.confirmEnabled) return;
    setPhase('verifying');
    setFailure(null);
    start.mutate({ start_code: digits }, { onSuccess: finishStarted, onError: handleFailure });
  }, [digits, finishStarted, handleFailure, start, view.confirmEnabled]);

  const reset = useCallback((): void => {
    setDigits('');
    setPhase('editing');
    setFailure(null);
    setErrorShake(false);
    setOverride(null);
    setRateUntil(null);
  }, []);

  return { view, digits, setDigits, submit, reset };
}
