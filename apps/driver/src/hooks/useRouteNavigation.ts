import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { getSecureStoragePort } from '@voyyaa/app-runtime';
import {
  buildNavigationLinks,
  isNavigableTarget,
  type NavigationApp,
  type NavigationPlatform,
  type NavigationTarget,
} from '../trip/directions-url';
import {
  detectInstalledApps,
  openRoute,
  parseRememberedApp,
  type RouteOpening,
} from '../trip/route-opener';

const REMEMBERED_APP_KEY = 'voyya_navigation_app';

function currentPlatform(): NavigationPlatform {
  if (Platform.OS === 'ios') return 'ios';
  return Platform.OS === 'android' ? 'android' : 'web';
}

export interface RouteNavigation {
  available: boolean;
  appInUse: NavigationApp | null;
  canChangeApp: boolean;
  chooserApps: readonly NavigationApp[] | null;
  failedCoordinates: string | null;
  open: () => void;
  openChooser: () => void;
  choose: (app: NavigationApp) => void;
  dismissChooser: () => void;
  dismissFailure: () => void;
}

export function useRouteNavigation(target: NavigationTarget | null): RouteNavigation {
  const [remembered, setRemembered] = useState<NavigationApp | null>(null);
  const [installed, setInstalled] = useState<readonly NavigationApp[]>([]);
  const [chooserApps, setChooserApps] = useState<readonly NavigationApp[] | null>(null);
  const [failedCoordinates, setFailedCoordinates] = useState<string | null>(null);
  const navigable = isNavigableTarget(target);
  const lat = target?.lat;
  const lng = target?.lng;

  useEffect(() => {
    let cancelled = false;
    void getSecureStoragePort()
      .getItem(REMEMBERED_APP_KEY)
      .then((raw) => {
        if (!cancelled) setRemembered(parseRememberedApp(raw));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!navigable || lat === undefined || lng === undefined) return;
    let cancelled = false;
    const links = buildNavigationLinks({ lat, lng }, currentPlatform());
    void detectInstalledApps(links, Linking).then((apps) => {
      if (!cancelled) setInstalled(apps);
    });
    return () => {
      cancelled = true;
    };
  }, [navigable, lat, lng]);

  const settle = useCallback((outcome: RouteOpening): void => {
    if (outcome.kind === 'choose') setChooserApps(outcome.apps);
    if (outcome.kind === 'failed') setFailedCoordinates(outcome.coordinates);
  }, []);

  const run = useCallback(
    (forcedApp?: NavigationApp): void => {
      if (!isNavigableTarget(target)) return;
      void openRoute({
        target,
        platform: currentPlatform(),
        remembered,
        forcedApp,
        port: Linking,
      }).then(settle);
    },
    [target, remembered, settle],
  );

  const choose = useCallback(
    (app: NavigationApp): void => {
      setChooserApps(null);
      setRemembered(app);
      void getSecureStoragePort()
        .setItem(REMEMBERED_APP_KEY, app)
        .catch(() => undefined);
      run(app);
    },
    [run],
  );

  const appInUse =
    remembered !== null && installed.includes(remembered)
      ? remembered
      : installed.length === 1
        ? (installed[0] ?? null)
        : null;

  return {
    available: navigable,
    appInUse,
    canChangeApp: installed.length > 1,
    chooserApps,
    failedCoordinates,
    open: () => run(),
    openChooser: () => setChooserApps(installed),
    choose,
    dismissChooser: () => setChooserApps(null),
    dismissFailure: () => setFailedCoordinates(null),
  };
}
