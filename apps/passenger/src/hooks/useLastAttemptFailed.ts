import { useEffect, useRef, useState } from 'react';
import { nextLastAttemptFailed } from '../lib/saved-trip-mode';

export function useLastAttemptFailed(isError: boolean, offline: boolean): boolean {
  const [failed, setFailed] = useState(isError);
  const wasOffline = useRef(offline);

  useEffect(() => {
    const cameBackOnline = wasOffline.current && !offline;
    wasOffline.current = offline;
    setFailed((previous) => nextLastAttemptFailed(previous, { isError, cameBackOnline }));
  }, [isError, offline]);

  return failed;
}
