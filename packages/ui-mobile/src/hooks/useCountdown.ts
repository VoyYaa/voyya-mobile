import { useEffect, useState } from 'react';

function computeRemaining(deadlineIso: string | null): number {
  if (!deadlineIso) return 0;
  const remainingMs = new Date(deadlineIso).getTime() - Date.now();
  return Math.max(0, Math.floor(remainingMs / 1000));
}

export function useCountdown(deadlineIso: string | null, frozen = false): number {
  const [remainingSec, setRemainingSec] = useState(() => computeRemaining(deadlineIso));

  useEffect(() => {
    if (frozen) return;
    setRemainingSec(computeRemaining(deadlineIso));
    if (!deadlineIso) return;
    const interval = setInterval(() => setRemainingSec(computeRemaining(deadlineIso)), 1000);
    return () => clearInterval(interval);
  }, [deadlineIso, frozen]);

  return remainingSec;
}
