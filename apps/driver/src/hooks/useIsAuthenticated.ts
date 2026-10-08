import { useSessionStore } from '@voyyaa/app-runtime';

export function useIsAuthenticated(): boolean {
  return useSessionStore((state) => state.status === 'authenticated');
}
