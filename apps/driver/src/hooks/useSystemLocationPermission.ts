import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';

export type SystemLocationPermission = 'denied' | 'allowed' | 'unknown';

async function readPermission(): Promise<SystemLocationPermission> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'denied') return 'denied';
    return status === 'granted' ? 'allowed' : 'unknown';
  } catch {
    return 'unknown';
  }
}

export function useSystemLocationPermission(): SystemLocationPermission {
  const [permission, setPermission] = useState<SystemLocationPermission>('unknown');

  useEffect(() => {
    let active = true;
    const refresh = (): void => {
      void readPermission().then((next) => {
        if (active) setPermission(next);
      });
    };
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return permission;
}
