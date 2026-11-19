import type { DemoSession } from '@voyyaa/shared';
import { useSessionStore } from '../session/useSessionStore';
import { demoSessionOf } from './demo-session';

export function useDemoSession(): DemoSession | null {
  return useSessionStore((state) => demoSessionOf(state.user));
}
