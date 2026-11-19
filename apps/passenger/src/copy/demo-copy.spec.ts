import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { demoCopy } from './demo-copy.ts';

function flatten(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (typeof value === 'function') return [(value as (name: string) => string)('Villa Demo')];
  if (typeof value === 'object' && value !== null) return Object.values(value).flatMap(flatten);
  return [];
}

const texts = flatten(demoCopy);

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('passenger demo copy (CA-DX-10, CA-DX-22)', () => {
  it('has the seventeen keys of the design, counting the info body and its three bullets', () => {
    assert.equal(texts.length, 17);
    assert.equal(demoCopy.info.bullets.length, 3);
  });

  it('never calls a fare official unless it is to deny it', () => {
    for (const text of texts) {
      if (!/oficial/i.test(text)) continue;
      assert.match(text, /no es una tarifa oficial/i, text);
    }
  });

  it('names no real municipality, company or document of sale', () => {
    for (const text of texts) {
      assert.doesNotMatch(text, /yarumal|cootrayal|factura/i, text);
    }
  });

  it('writes the reference point with the municipality, never as the current location', () => {
    assert.equal(demoCopy.referencePoint('Villa Demo'), 'Punto de referencia · Villa Demo');
    assert.doesNotMatch(demoCopy.referencePoint('Villa Demo'), /ubicación actual/i);
  });
});

describe('demo wiring of the passenger screens', () => {
  const home = source('../../app/index.tsx');
  const destination = source('../../app/destination.tsx');
  const confirm = source('../../app/confirm.tsx');
  const searching = source('../../app/searching.tsx');
  const phone = source('../../app/(auth)/phone.tsx');
  const otp = source('../../app/(auth)/otp.tsx');

  it('shows the tag first in the home sheet and the account note in the account sheet', () => {
    assert.match(home, /<DemoTag \/>\s+\{trip \? \(/);
    assert.match(home, /demoNote=\{isDemo \? uiCopy\.demo\.accountNote : undefined\}/);
  });

  it('keeps the banner of a switched-off location and the auto resolution off in a demo session (CA-DX-7)', () => {
    assert.match(home, /demo: isDemo,/);
    assert.match(home, /originSource === 'manual' && !isDemo/);
    assert.match(home, /resolveOrigin\.status === 'idle' && !isDemo/);
    assert.match(home, /!origin && !isDemo\) resolveOrigin\.resolve\(\)/);
  });

  it('opens the unavailable-demo panel only for the reference origin, so a pin keeps the usual notice', () => {
    assert.match(home, /demo=\{isDemoReferenceOrigin\(origin, demo\)\}/);
  });

  it('never puts the blue dot on the destination map in a demo session (CA-DX-2)', () => {
    assert.match(destination, /myLocation=\{isDemo \? null : deviceCenter\}/);
  });

  it('looks a place up among the demo places, not among the real ones', () => {
    assert.match(destination, /isDemo \? pickupPlaces\.places : allVerifiedPlaces\(\)/);
  });

  it('notes the sample fare, the search and the missing driver', () => {
    assert.match(confirm, /demo\.fareNote/);
    assert.match(searching, /demo\.searchingNote/);
    assert.match(searching, /demo\.noDriverNote/);
  });

  it('keeps every demo text out of the phone and code screens, except the notice of an ended session (CA-DX-13)', () => {
    assert.doesNotMatch(phone, /passengerCopy\.demo|useDemoSession|isDemoSession/);
    assert.doesNotMatch(otp, /passengerCopy\.demo|useDemoSession|isDemoSession/);
  });
});
