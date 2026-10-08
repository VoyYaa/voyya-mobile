import { useEffect, useRef, useState } from 'react';

export interface DelayedLoadingOptions {
  delayMs?: number;
  minMs?: number;
}

export function useDelayedLoading(
  isLoading: boolean,
  { delayMs = 200, minMs = 400 }: DelayedLoadingOptions = {},
): boolean {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      if (visible) return;
      const showTimer = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, delayMs);
      return () => clearTimeout(showTimer);
    }

    if (!visible) return;
    const elapsed = shownAt.current === null ? minMs : Date.now() - shownAt.current;
    const hideTimer = setTimeout(
      () => {
        shownAt.current = null;
        setVisible(false);
      },
      Math.max(0, minMs - elapsed),
    );
    return () => clearTimeout(hideTimer);
  }, [isLoading, visible, delayMs, minMs]);

  return visible;
}
