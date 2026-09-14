import { useEffect } from 'react';
import { tryRefreshSession, useSessionStore } from './useSessionStore';

const PROACTIVE_MARGIN_MS = 60_000;

export function useProactiveRefresh(): void {
  const status = useSessionStore((s) => s.status);
  const accessTokenExpiresAt = useSessionStore((s) => s.accessTokenExpiresAt);

  useEffect(() => {
    if (status !== 'authenticated' || !accessTokenExpiresAt) return;

    const delayMs = Math.max(0, accessTokenExpiresAt - Date.now() - PROACTIVE_MARGIN_MS);
    const timer = setTimeout(() => {
      void tryRefreshSession();
    }, delayMs);

    return () => clearTimeout(timer);
  }, [status, accessTokenExpiresAt]);
}
