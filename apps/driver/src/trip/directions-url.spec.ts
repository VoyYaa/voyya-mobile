import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildNavigationLinks,
  formatCoordinatesText,
  isNavigableTarget,
  type NavigationLinks,
  type NavigationPlatform,
} from './directions-url.ts';

const PICKUP = { lat: 6.9612, lng: -75.4178 };
const PLATFORMS: readonly NavigationPlatform[] = ['android', 'ios', 'web'];

function allUrls(links: NavigationLinks): string[] {
  return [
    links.google_maps.appUrl,
    links.google_maps.webUrl,
    links.waze.appUrl,
    links.waze.webUrl,
    ...(links.geoUrl ? [links.geoUrl] : []),
  ];
}

describe('buildNavigationLinks', () => {
  it('builds the Android links from coordinates with six decimals', () => {
    const links = buildNavigationLinks(PICKUP, 'android');
    assert.equal(links.google_maps.appUrl, 'google.navigation:q=6.961200,-75.417800');
    assert.equal(
      links.google_maps.webUrl,
      'https://www.google.com/maps/dir/?api=1&destination=6.961200,-75.417800&travelmode=driving',
    );
    assert.equal(links.waze.appUrl, 'waze://?ll=6.961200,-75.417800&navigate=yes');
    assert.equal(links.waze.webUrl, 'https://waze.com/ul?ll=6.961200,-75.417800&navigate=yes');
  });

  it('builds the iOS Google Maps link with the comgooglemaps scheme', () => {
    const links = buildNavigationLinks(PICKUP, 'ios');
    assert.equal(
      links.google_maps.appUrl,
      'comgooglemaps://?daddr=6.961200,-75.417800&directionsmode=driving',
    );
    assert.equal(links.geoUrl, null);
  });

  it('offers the system geo chooser only on Android', () => {
    assert.equal(
      buildNavigationLinks(PICKUP, 'android').geoUrl,
      'geo:6.961200,-75.417800?q=6.961200,-75.417800',
    );
    assert.equal(buildNavigationLinks(PICKUP, 'web').geoUrl, null);
  });

  it('never puts a label on the geo link', () => {
    const geo = buildNavigationLinks(PICKUP, 'android').geoUrl ?? '';
    assert.equal(/[()]/.test(geo), false);
    assert.match(geo, /^geo:-?\d+\.\d{6},-?\d+\.\d{6}\?q=-?\d+\.\d{6},-?\d+\.\d{6}$/);
  });

  it('carries only coordinates and fixed parameters in every URL', () => {
    const pair = '6.961200,-75.417800';
    const allowedTemplates = new Set([
      'google.navigation:q={c}',
      'https://www.google.com/maps/dir/?api=1&destination={c}&travelmode=driving',
      'comgooglemaps://?daddr={c}&directionsmode=driving',
      'waze://?ll={c}&navigate=yes',
      'https://waze.com/ul?ll={c}&navigate=yes',
      'geo:{c}?q={c}',
    ]);
    for (const platform of PLATFORMS) {
      for (const url of allUrls(buildNavigationLinks(PICKUP, platform))) {
        assert.equal(/[()%\s]/.test(url), false, url);
        const template = url.split(pair).join('{c}');
        const isGoogleWebOnWeb = platform === 'web' && url.startsWith('https://www.google.com');
        assert.equal(allowedTemplates.has(template) || isGoogleWebOnWeb, true, url);
      }
    }
  });

  it('keeps a dot decimal separator and the sign in every hemisphere', () => {
    const links = buildNavigationLinks({ lat: -33.4, lng: 151.25 }, 'android');
    assert.equal(links.google_maps.appUrl, 'google.navigation:q=-33.400000,151.250000');
    for (const url of allUrls(links)) assert.equal(url.includes('33,4'), false);
  });
});

describe('isNavigableTarget', () => {
  it('accepts valid coordinates', () => {
    assert.equal(isNavigableTarget(PICKUP), true);
    assert.equal(isNavigableTarget({ lat: 0, lng: 0 }), true);
  });

  it('rejects missing, non finite and out of range coordinates', () => {
    assert.equal(isNavigableTarget(null), false);
    assert.equal(isNavigableTarget({ lat: Number.NaN, lng: 1 }), false);
    assert.equal(isNavigableTarget({ lat: 1, lng: Number.POSITIVE_INFINITY }), false);
    assert.equal(isNavigableTarget({ lat: 91, lng: 0 }), false);
    assert.equal(isNavigableTarget({ lat: 0, lng: -181 }), false);
  });
});

describe('formatCoordinatesText', () => {
  it('formats the coordinates the driver can type by hand', () => {
    assert.equal(formatCoordinatesText(PICKUP), '6.96120, -75.41780');
  });
});
