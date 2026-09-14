import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useSessionStore } from '@voyyaa/app-runtime';

export function useRouteGuard(): void {
  const status = useSessionStore((s) => s.status);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'hydrating') return;
    const inAuthGroup = segments[0] === '(auth)';

    if (status === 'guest' && !inAuthGroup) {
      router.replace('/(auth)/phone');
    } else if (status === 'authenticated' && inAuthGroup) {
      router.replace('/');
    }
  }, [status, segments, router]);
}
