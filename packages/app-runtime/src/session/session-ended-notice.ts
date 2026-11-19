import { create } from 'zustand';
import type { SessionUser } from '@voyyaa/shared';
import { isDemoSession } from '../demo/demo-session';

export interface SessionEndedNotice {
  demo: boolean;
}

export function noticeForEndedSession(user: SessionUser | null): SessionEndedNotice | null {
  if (user === null) return null;
  return { demo: isDemoSession(user) };
}

interface SessionEndedNoticeState {
  notice: SessionEndedNotice | null;
  raise: (notice: SessionEndedNotice | null) => void;
  take: () => SessionEndedNotice | null;
  discard: () => void;
}

export const useSessionEndedNoticeStore = create<SessionEndedNoticeState>((set, get) => ({
  notice: null,
  raise: (notice) => set({ notice }),
  take: () => {
    const { notice } = get();
    if (notice !== null) set({ notice: null });
    return notice;
  },
  discard: () => set({ notice: null }),
}));

export interface EndSessionByRejectionDeps {
  getUser: () => SessionUser | null;
  raise: (notice: SessionEndedNotice | null) => void;
  clear: () => Promise<void>;
}

export async function endSessionByRejection(deps: EndSessionByRejectionDeps): Promise<void> {
  deps.raise(noticeForEndedSession(deps.getUser()));
  await deps.clear();
}
