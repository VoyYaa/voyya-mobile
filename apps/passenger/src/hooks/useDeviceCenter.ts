import { useEffect, useState } from 'react';
import type { Coordinate } from '@voyyaa/shared';
import { requestDeviceLocation, useDemoSession } from '@voyyaa/app-runtime';

export function useDeviceCenter(enabled: boolean): Coordinate | null {
  const demo = useDemoSession();
  const [center, setCenter] = useState<Coordinate | null>(null);

  useEffect(() => {
    if (!enabled || demo !== null) return undefined;
    let active = true;
    void requestDeviceLocation().then((outcome) => {
      if (active && outcome.kind === 'granted') setCenter(outcome.coordinate);
    });
    return () => {
      active = false;
    };
  }, [enabled, demo]);

  return demo !== null ? demo.center : center;
}
