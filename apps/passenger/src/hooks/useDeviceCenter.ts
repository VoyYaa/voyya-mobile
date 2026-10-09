import { useEffect, useState } from 'react';
import type { Coordinate } from '@voyyaa/shared';
import { requestDeviceLocation } from '@voyyaa/app-runtime';

export function useDeviceCenter(enabled: boolean): Coordinate | null {
  const [center, setCenter] = useState<Coordinate | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    void requestDeviceLocation().then((outcome) => {
      if (active && outcome.kind === 'granted') setCenter(outcome.coordinate);
    });
    return () => {
      active = false;
    };
  }, [enabled]);

  return center;
}
