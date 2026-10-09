import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

const TICK_MS = 5000;
const RESUME_GRACE_MS = 5000;
const MS_PER_SEC = 1000;

export function useElapsedSince(updatedAtMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(interval);
  }, [updatedAtMs]);

  return updatedAtMs > 0 ? Math.max(0, Math.floor((now - updatedAtMs) / MS_PER_SEC)) : 0;
}

export function useResumingAfterBackground(updatedAtMs: number): boolean {
  const [resumedAt, setResumedAt] = useState<{ updatedAtMs: number } | null>(null);

  useEffect(() => {
    let previous: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active' && previous !== 'active') setResumedAt({ updatedAtMs });
      previous = next;
    });
    return () => subscription.remove();
  }, [updatedAtMs]);

  useEffect(() => {
    if (resumedAt === null) return;
    const timer = setTimeout(() => setResumedAt(null), RESUME_GRACE_MS);
    return () => clearTimeout(timer);
  }, [resumedAt]);

  return resumedAt !== null && resumedAt.updatedAtMs === updatedAtMs;
}
