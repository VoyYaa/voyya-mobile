export type NavigationPlatform = 'ios' | 'android' | 'web';
export type NavigationApp = 'google_maps' | 'waze';

export interface NavigationTarget {
  lat: number;
  lng: number;
}

export interface NavigationAppLinks {
  appUrl: string;
  webUrl: string;
}

export interface NavigationLinks {
  google_maps: NavigationAppLinks;
  waze: NavigationAppLinks;
  geoUrl: string | null;
}

const COORDINATE_DECIMALS = 6;
const TEXT_DECIMALS = 5;
const MAX_LATITUDE = 90;
const MAX_LONGITUDE = 180;

export function isNavigableTarget(target: NavigationTarget | null): target is NavigationTarget {
  return (
    target !== null &&
    Number.isFinite(target.lat) &&
    Number.isFinite(target.lng) &&
    Math.abs(target.lat) <= MAX_LATITUDE &&
    Math.abs(target.lng) <= MAX_LONGITUDE
  );
}

function fixed(value: number): string {
  return value.toFixed(COORDINATE_DECIMALS);
}

export function formatCoordinatesText(target: NavigationTarget): string {
  return `${target.lat.toFixed(TEXT_DECIMALS)}, ${target.lng.toFixed(TEXT_DECIMALS)}`;
}

function googleMapsLinks(pair: string, platform: NavigationPlatform): NavigationAppLinks {
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${pair}&travelmode=driving`;
  if (platform === 'ios') {
    return { appUrl: `comgooglemaps://?daddr=${pair}&directionsmode=driving`, webUrl };
  }
  if (platform === 'android') return { appUrl: `google.navigation:q=${pair}`, webUrl };
  return { appUrl: webUrl, webUrl };
}

function wazeLinks(pair: string): NavigationAppLinks {
  return {
    appUrl: `waze://?ll=${pair}&navigate=yes`,
    webUrl: `https://waze.com/ul?ll=${pair}&navigate=yes`,
  };
}

export function buildNavigationLinks(
  target: NavigationTarget,
  platform: NavigationPlatform,
): NavigationLinks {
  const pair = `${fixed(target.lat)},${fixed(target.lng)}`;
  return {
    google_maps: googleMapsLinks(pair, platform),
    waze: wazeLinks(pair),
    geoUrl: platform === 'android' ? `geo:${pair}?q=${pair}` : null,
  };
}
