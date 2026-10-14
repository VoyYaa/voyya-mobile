import { useCallback, useEffect, useRef, useState } from 'react';
import { useCountdown } from '@voyyaa/ui-mobile';
import { RATE_LIMIT_FALLBACK_SEC } from '../constants/parameters';

export interface WaitDeadline {
  active: boolean;
  remainingSec: number;
  timeKnown: boolean;
  start: (waitSec: number | null) => void;
  clear: () => void;
}

export function useWaitDeadline(onElapsed?: () => void): WaitDeadline {
  const [deadline, setDeadline] = useState<string | null>(null);
  const [timeKnown, setTimeKnown] = useState(true);
  const remainingSec = useCountdown(deadline);
  const active = deadline !== null && remainingSec > 0;
  const seenActive = useRef(false);
  const onElapsedRef = useRef(onElapsed);
  onElapsedRef.current = onElapsed;

  useEffect(() => {
    if (active) {
      seenActive.current = true;
      return;
    }
    if (!seenActive.current) return;
    seenActive.current = false;
    setDeadline(null);
    onElapsedRef.current?.();
  }, [active]);

  const start = useCallback((waitSec: number | null): void => {
    setTimeKnown(waitSec !== null);
    setDeadline(new Date(Date.now() + (waitSec ?? RATE_LIMIT_FALLBACK_SEC) * 1000).toISOString());
  }, []);

  const clear = useCallback((): void => {
    seenActive.current = false;
    setDeadline(null);
  }, []);

  return { active, remainingSec, timeKnown, start, clear };
}
