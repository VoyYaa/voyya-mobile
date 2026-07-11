import { useEffect, useState } from 'react';

export function useCountdown(deadlineIso: string | null): number {
  const calculate = (): number => {
    if (!deadlineIso) return 0;
    const remainingMs = new Date(deadlineIso).getTime() - Date.now();
    return Math.max(0, Math.floor(remainingMs / 1000));
  };

  const [remainingSec, setRemainingSec] = useState(calculate);

  useEffect(() => {
    setRemainingSec(calculate());
    if (!deadlineIso) return;
    const interval = setInterval(() => setRemainingSec(calculate()), 1000);
    return () => clearInterval(interval);
  }, [deadlineIso]);

  return remainingSec;
}
