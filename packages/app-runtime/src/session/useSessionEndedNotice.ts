import { useCallback, useEffect, useState } from 'react';
import { useSessionEndedNoticeStore, type SessionEndedNotice } from './session-ended-notice';

export interface SessionEndedNoticeView {
  notice: SessionEndedNotice | null;
  dismiss: () => void;
}

export function useSessionEndedNotice(): SessionEndedNoticeView {
  const [notice, setNotice] = useState<SessionEndedNotice | null>(null);

  useEffect(() => {
    const taken = useSessionEndedNoticeStore.getState().take();
    if (taken !== null) setNotice(taken);
  }, []);

  const dismiss = useCallback(() => setNotice(null), []);
  return { notice, dismiss };
}
