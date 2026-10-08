import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useSessionStore } from '@voyyaa/app-runtime';
import { resolveGateRedirect } from '../auth/route-gate';
import { forgetTemporaryPin } from '../auth/remembered-pin';
import { usePinChangeRequired, usePinGateStore } from '../auth/usePinGateStore';

export function useRouteGuard(): void {
  const status = useSessionStore((s) => s.status);
  const pinRequired = usePinChangeRequired();
  const celebrating = usePinGateStore((s) => s.celebrating);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'guest') return;
    forgetTemporaryPin();
    usePinGateStore.getState().setForced(false);
    usePinGateStore.getState().setCelebrating(false);
  }, [status]);

  useEffect(() => {
    const redirect = resolveGateRedirect({
      status,
      inAuthGroup: segments[0] === '(auth)',
      onCreatePin: segments[0] === '(auth)' && segments[1] === 'create-pin',
      pinRequired,
      celebrating,
    });
    if (redirect) router.replace(redirect);
  }, [status, pinRequired, celebrating, segments, router]);
}
