import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { openRoute, parseRememberedApp, type LinkingPort } from './route-opener.ts';

const TARGET = { lat: 6.9612, lng: -75.4178 };
const GOOGLE_APP = 'google.navigation:q=6.961200,-75.417800';
const GOOGLE_WEB =
  'https://www.google.com/maps/dir/?api=1&destination=6.961200,-75.417800&travelmode=driving';
const WAZE_APP = 'waze://?ll=6.961200,-75.417800&navigate=yes';
const WAZE_WEB = 'https://waze.com/ul?ll=6.961200,-75.417800&navigate=yes';
const GEO = 'geo:6.961200,-75.417800?q=6.961200,-75.417800';

interface FakePort extends LinkingPort {
  opened: string[];
}

function fakePort(options: { installed?: string[]; failing?: string[] }): FakePort {
  const installed = new Set(options.installed ?? []);
  const failing = new Set(options.failing ?? []);
  const opened: string[] = [];
  return {
    opened,
    canOpenURL: async (url) => installed.has(url),
    openURL: async (url) => {
      if (failing.has(url)) throw new Error('cannot open');
      opened.push(url);
    },
  };
}

describe('openRoute', () => {
  it('R3: opens the only installed app directly', async () => {
    const port = fakePort({ installed: [WAZE_APP] });
    const outcome = await openRoute({
      target: TARGET,
      platform: 'android',
      remembered: null,
      port,
    });
    assert.deepEqual(outcome, { kind: 'opened', via: 'app', app: 'waze' });
    assert.deepEqual(port.opened, [WAZE_APP]);
  });

  it('R1: asks which app to use when two are installed and none is remembered', async () => {
    const port = fakePort({ installed: [GOOGLE_APP, WAZE_APP] });
    const outcome = await openRoute({
      target: TARGET,
      platform: 'android',
      remembered: null,
      port,
    });
    assert.deepEqual(outcome, { kind: 'choose', apps: ['google_maps', 'waze'] });
    assert.deepEqual(port.opened, []);
  });

  it('R2: opens the remembered app without asking', async () => {
    const port = fakePort({ installed: [GOOGLE_APP, WAZE_APP] });
    const outcome = await openRoute({
      target: TARGET,
      platform: 'android',
      remembered: 'waze',
      port,
    });
    assert.deepEqual(outcome, { kind: 'opened', via: 'app', app: 'waze' });
    assert.deepEqual(port.opened, [WAZE_APP]);
  });

  it('R7: ignores a remembered app that is no longer installed', async () => {
    const port = fakePort({ installed: [GOOGLE_APP] });
    const outcome = await openRoute({
      target: TARGET,
      platform: 'android',
      remembered: 'waze',
      port,
    });
    assert.deepEqual(outcome, { kind: 'opened', via: 'app', app: 'google_maps' });
  });

  it('opens the app chosen in the selector even if it was not remembered', async () => {
    const port = fakePort({ installed: [GOOGLE_APP, WAZE_APP] });
    const outcome = await openRoute({
      target: TARGET,
      platform: 'android',
      remembered: 'waze',
      forcedApp: 'google_maps',
      port,
    });
    assert.deepEqual(outcome, { kind: 'opened', via: 'app', app: 'google_maps' });
    assert.deepEqual(port.opened, [GOOGLE_APP]);
  });

  it('R4: opens the system geo chooser on Android when no app is installed', async () => {
    const port = fakePort({});
    const outcome = await openRoute({
      target: TARGET,
      platform: 'android',
      remembered: null,
      port,
    });
    assert.deepEqual(outcome, { kind: 'opened', via: 'system', app: null });
    assert.deepEqual(port.opened, [GEO]);
  });

  it('R4: falls back to Google Maps on the web when geo has no handler', async () => {
    const port = fakePort({ failing: [GEO] });
    const outcome = await openRoute({
      target: TARGET,
      platform: 'android',
      remembered: null,
      port,
    });
    assert.deepEqual(outcome, { kind: 'opened', via: 'web', app: 'google_maps' });
    assert.deepEqual(port.opened, [GOOGLE_WEB]);
  });

  it('R4: on iOS without apps it goes straight to Google Maps on the web', async () => {
    const port = fakePort({});
    const outcome = await openRoute({ target: TARGET, platform: 'ios', remembered: null, port });
    assert.deepEqual(outcome, { kind: 'opened', via: 'web', app: 'google_maps' });
    assert.equal(
      port.opened.some((url) => url.startsWith('geo:')),
      false,
    );
  });

  it('uses the web link of the app when the installed app fails to open', async () => {
    const port = fakePort({ installed: [WAZE_APP], failing: [WAZE_APP] });
    const outcome = await openRoute({
      target: TARGET,
      platform: 'android',
      remembered: null,
      port,
    });
    assert.deepEqual(outcome, { kind: 'opened', via: 'web', app: 'waze' });
    assert.deepEqual(port.opened, [WAZE_WEB]);
  });

  it('R5: shows the coordinates when nothing opens', async () => {
    const port = fakePort({ failing: [GEO, GOOGLE_WEB] });
    const outcome = await openRoute({
      target: TARGET,
      platform: 'android',
      remembered: null,
      port,
    });
    assert.deepEqual(outcome, { kind: 'failed', coordinates: '6.96120, -75.41780' });
    assert.deepEqual(port.opened, []);
  });

  it('treats a throwing canOpenURL as not installed', async () => {
    const port: LinkingPort = {
      canOpenURL: async () => {
        throw new Error('query blocked');
      },
      openURL: async () => undefined,
    };
    const outcome = await openRoute({
      target: TARGET,
      platform: 'android',
      remembered: null,
      port,
    });
    assert.deepEqual(outcome, { kind: 'opened', via: 'system', app: null });
  });

  it('never calls the phone with an invalid target', async () => {
    const port = fakePort({ installed: [GOOGLE_APP] });
    const outcome = await openRoute({
      target: { lat: Number.NaN, lng: 0 },
      platform: 'android',
      remembered: null,
      port,
    });
    assert.equal(outcome.kind, 'failed');
    assert.deepEqual(port.opened, []);
  });
});

describe('parseRememberedApp', () => {
  it('accepts only known apps', () => {
    assert.equal(parseRememberedApp('waze'), 'waze');
    assert.equal(parseRememberedApp('google_maps'), 'google_maps');
    assert.equal(parseRememberedApp('apple_maps'), null);
    assert.equal(parseRememberedApp(null), null);
  });
});
