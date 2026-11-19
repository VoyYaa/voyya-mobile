import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { areLocationServicesEnabled } from '@voyyaa/app-runtime';

export function useLocationServices(enabled: boolean): boolean | null {
  const [servicesEnabled, setServicesEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    const probe = (): void => {
      void areLocationServicesEnabled().then((value) => {
        if (active) setServicesEnabled(value);
      });
    };
    probe();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') probe();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [enabled]);

  return servicesEnabled;
}
