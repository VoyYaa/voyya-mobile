import type { DemoSession, SessionUser } from '@voyyaa/shared';

type UserWithDemo = Pick<SessionUser, 'demo_session'>;

export function demoSessionOf(user: UserWithDemo | null | undefined): DemoSession | null {
  return user?.demo_session ?? null;
}

export function isDemoSession(user: UserWithDemo | null | undefined): boolean {
  return demoSessionOf(user) !== null;
}
