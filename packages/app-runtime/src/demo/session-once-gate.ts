export interface SessionOnceGate {
  claim: (sessionStartedAt: number | null) => boolean;
}

export function createSessionOnceGate(): SessionOnceGate {
  let lastSession: number | null = null;
  return {
    claim: (sessionStartedAt) => {
      if (sessionStartedAt === null || lastSession === sessionStartedAt) return false;
      lastSession = sessionStartedAt;
      return true;
    },
  };
}
