import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { demoCopy } from './demo-copy.ts';
import { driverCopy } from './driver-copy.ts';

function flatten(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (typeof value === 'object' && value !== null) return Object.values(value).flatMap(flatten);
  return [];
}

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

const texts = flatten(demoCopy);

describe('driver demo copy (CA-DX-22)', () => {
  it('has the thirteen keys of the design, counting the info body and its three bullets', () => {
    assert.equal(texts.length, 13);
    assert.equal(demoCopy.info.bullets.length, 3);
  });

  it('is reachable from the driver copy', () => {
    assert.equal(driverCopy.demo, demoCopy);
  });

  it('promises nothing about the product and names no real municipality, company or tax document', () => {
    for (const text of texts) {
      assert.doesNotMatch(text, /yarumal|cootrayal|factura|oficial/i, text);
    }
  });

  it('says the money is not real wherever the cash appears', () => {
    assert.match(demoCopy.cashNote, /no se cobra dinero real/);
    assert.match(demoCopy.info.bullets[2] ?? '', /no se cobra dinero real/);
  });

  it('keeps the legal texts out of the demo notes: they only add a line', () => {
    assert.doesNotMatch(demoCopy.consentNote, /Ley 1581|versi[oó]n|responsable/i);
    assert.doesNotMatch(demoCopy.disclosureNote, /Ley 1581|versi[oó]n|responsable/i);
  });
});

describe('ended-session copy of the driver login (CA-DX-15)', () => {
  it('words it the same for everyone, plus one demo text', () => {
    assert.equal(driverCopy.login.sessionEnded.title, 'Tu sesión terminó');
    assert.equal(
      driverCopy.login.sessionEnded.body,
      'Por seguridad, vuelve a iniciar sesión para seguir.',
    );
    assert.match(driverCopy.login.sessionEnded.demoBody, /demostración/);
  });

  it('shows the demo body only from the local notice of an ended session, never before signing in (CA-DX-13)', () => {
    const login = source('../../app/(auth)/login.tsx');
    assert.match(login, /sessionEndedBodyOf\(endedNotice, driverCopy\.login\.sessionEnded\)/);
    assert.doesNotMatch(login, /driverCopy\.demo|useDemoSession|isDemoSession/);
  });
});

describe('demo wiring of the driver screens', () => {
  const home = source('../../app/index.tsx');
  const trip = source('../../app/trip/[id].tsx');
  const consentSheet = source('../components/LocationConsentSheet.tsx');
  const disclosureSheet = source('../components/SharingDisclosureSheet.tsx');
  const startCodeSheet = source('../components/StartCodeSheet.tsx');
  const finishSheet = source('../components/FinishTripSheet.tsx');
  const issueWatch = source('../hooks/useLocationIssueWatch.ts');

  it('shows the tag first in the home scroll and the account note in the account sheet', () => {
    assert.match(home, /<DemoTag \/>\s+\{locationIssue && \(/);
    assert.match(home, /demoNote=\{isDemo \? uiCopy\.demo\.accountNote : undefined\}/);
  });

  it('shows the tag first in the trip scroll, above the sharing badge', () => {
    assert.match(trip, /<DemoTag \/>\s+<SharingStatusBadge/);
  });

  it('opens the consent notice by itself once per session on the trip screen, and the disclosure after it (CA-DX-17)', () => {
    assert.match(trip, /isDemo && consentRequired && demoConsentGate\.claim\(sessionStartedAt\)/);
    assert.match(trip, /disclosure\.showIfUnseen\(\{ force: isDemo \}\)/);
    assert.match(trip, /mode="accept"/);
  });

  it('adds the demo notes to the consent and the disclosure without touching the legal rows', () => {
    assert.match(consentSheet, /demoNote=\{demo \? driverCopy\.demo\.consentNote : undefined\}/);
    assert.match(disclosureSheet, /driverCopy\.demo\.disclosureNote/);
  });

  it('adds the start code hint and the cash note only through the demo note component (CA-DX-20)', () => {
    assert.match(startCodeSheet, /<DemoNote\s+text=\{driverCopy\.demo\.startCodeHint\}/);
    assert.match(finishSheet, /<DemoNote\s+text=\{driverCopy\.demo\.cashNote\}/);
  });

  it('keeps the device watch off in a demo session (CA-DX-18)', () => {
    assert.match(issueWatch, /if \(!enabled \|\| demo\) return undefined;/);
  });
});
