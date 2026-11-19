import { shouldAnnounceDemo } from './demo-origin';

export interface DemoAnnouncementGate {
  claim: (sessionStartedAt: number | null) => boolean;
}

export function createDemoAnnouncementGate(): DemoAnnouncementGate {
  let lastSession: number | null = null;
  return {
    claim: (sessionStartedAt) => {
      if (!shouldAnnounceDemo(lastSession, sessionStartedAt)) return false;
      lastSession = sessionStartedAt;
      return true;
    },
  };
}

export const demoAnnouncementGate = createDemoAnnouncementGate();
