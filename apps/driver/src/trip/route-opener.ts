import {
  buildNavigationLinks,
  formatCoordinatesText,
  isNavigableTarget,
  type NavigationApp,
  type NavigationLinks,
  type NavigationPlatform,
  type NavigationTarget,
} from './directions-url';

export const NAVIGATION_APPS: readonly NavigationApp[] = ['google_maps', 'waze'];

export interface LinkingPort {
  canOpenURL: (url: string) => Promise<boolean>;
  openURL: (url: string) => Promise<unknown>;
}

export type RouteOpening =
  | { kind: 'opened'; via: 'app' | 'web' | 'system'; app: NavigationApp | null }
  | { kind: 'choose'; apps: readonly NavigationApp[] }
  | { kind: 'failed'; coordinates: string };

export interface OpenRouteInput {
  target: NavigationTarget;
  platform: NavigationPlatform;
  remembered: NavigationApp | null;
  forcedApp?: NavigationApp;
  port: LinkingPort;
}

export function parseRememberedApp(raw: string | null): NavigationApp | null {
  return NAVIGATION_APPS.find((app) => app === raw) ?? null;
}

async function canOpenSafely(port: LinkingPort, url: string): Promise<boolean> {
  try {
    return await port.canOpenURL(url);
  } catch {
    return false;
  }
}

async function opensSafely(port: LinkingPort, url: string): Promise<boolean> {
  try {
    await port.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function detectInstalledApps(
  links: NavigationLinks,
  port: LinkingPort,
): Promise<NavigationApp[]> {
  const checks = await Promise.all(
    NAVIGATION_APPS.map(async (app) => ({
      app,
      installed: await canOpenSafely(port, links[app].appUrl),
    })),
  );
  return checks.filter((check) => check.installed).map((check) => check.app);
}

async function openApp(
  app: NavigationApp,
  links: NavigationLinks,
  port: LinkingPort,
): Promise<RouteOpening | null> {
  if (await opensSafely(port, links[app].appUrl)) return { kind: 'opened', via: 'app', app };
  if (await opensSafely(port, links[app].webUrl)) return { kind: 'opened', via: 'web', app };
  return null;
}

async function openFallback(
  links: NavigationLinks,
  target: NavigationTarget,
  port: LinkingPort,
): Promise<RouteOpening> {
  if (links.geoUrl && (await opensSafely(port, links.geoUrl))) {
    return { kind: 'opened', via: 'system', app: null };
  }
  if (await opensSafely(port, links.google_maps.webUrl)) {
    return { kind: 'opened', via: 'web', app: 'google_maps' };
  }
  return { kind: 'failed', coordinates: formatCoordinatesText(target) };
}

export async function openRoute({
  target,
  platform,
  remembered,
  forcedApp,
  port,
}: OpenRouteInput): Promise<RouteOpening> {
  if (!isNavigableTarget(target)) return { kind: 'failed', coordinates: '' };
  const links = buildNavigationLinks(target, platform);

  const installed = await detectInstalledApps(links, port);
  const chosen =
    forcedApp ??
    (remembered !== null && installed.includes(remembered) ? remembered : null) ??
    (installed.length === 1 ? (installed[0] ?? null) : null);

  if (chosen === null && installed.length > 1) return { kind: 'choose', apps: installed };

  if (chosen !== null) {
    const opened = await openApp(chosen, links, port);
    if (opened) return opened;
  }
  return openFallback(links, target, port);
}
