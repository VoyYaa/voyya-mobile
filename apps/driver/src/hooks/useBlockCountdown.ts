import { useCallback, useState } from 'react';
import { useCountdown } from '@voyyaa/ui-mobile';

const BLOCKED_FALLBACK_SEC = 90;

export interface BlockCountdown {
  isBlocked: boolean;
  remainingSec: number;
  timeKnown: boolean;
  startBlock: (retryInSec: number | undefined) => void;
}

export function useBlockCountdown(): BlockCountdown {
  const [deadline, setDeadline] = useState<string | null>(null);
  const [timeKnown, setTimeKnown] = useState(true);
  const remainingSec = useCountdown(deadline);

  const startBlock = useCallback((retryInSec: number | undefined): void => {
    setTimeKnown(retryInSec !== undefined);
    setDeadline(new Date(Date.now() + (retryInSec ?? BLOCKED_FALLBACK_SEC) * 1000).toISOString());
  }, []);

  return { isBlocked: deadline !== null && remainingSec > 0, remainingSec, timeKnown, startBlock };
}
