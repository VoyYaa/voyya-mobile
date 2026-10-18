import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

const savedView = source('./SavedTripView.tsx');
const startCodeCard = source('./StartCodeCard.tsx');
const inlineNotice = source('./InlineNotice.tsx');

const ALLOWED_TEST_IDS: readonly RegExp[] = [
  /^"[a-z-]+"$/,
  /^\{testID\}$/,
  /^\{`start-code-digit-\$\{index\}`\}$/,
];

function testIds(text: string): string[] {
  return [...text.matchAll(/testID=("[^"]*"|\{`[^`]*`\}|\{[^}]*\})/g)].map(
    (match) => match[1] as string,
  );
}

describe('SavedTripView privacy contract (RN-CS-09, C-8)', () => {
  it('uses only static test ids, never one that could carry the digits', () => {
    for (const text of [savedView, startCodeCard, inlineNotice]) {
      for (const id of testIds(text)) {
        assert.ok(
          ALLOWED_TEST_IDS.some((pattern) => pattern.test(id)),
          `testID ${id} is static or by position`,
        );
      }
    }
  });

  it('never puts the digits in accessibilityValue', () => {
    for (const text of [savedView, startCodeCard]) {
      assert.doesNotMatch(text, /accessibilityValue/);
    }
  });

  it('keeps the digits unselectable and out of the clipboard, with no copy or share action', () => {
    assert.match(startCodeCard, /selectable=\{false\}/);
    for (const text of [savedView, startCodeCard]) {
      assert.doesNotMatch(text, /Clipboard|Share\b|copiar|compartir/i);
    }
  });

  it('writes nothing to the console from the saved trip route (G-PP-09)', () => {
    const files = [
      './SavedTripView.tsx',
      './StartCodeCard.tsx',
      './InlineNotice.tsx',
      './ActiveTripView.tsx',
      './ActiveTripStartupGate.tsx',
      '../../app/driver-assigned.tsx',
      '../../app/_layout.tsx',
      '../hooks/useActiveTripStartup.ts',
      '../hooks/useStartCodeReconciler.ts',
      '../hooks/useStartCodePersistence.ts',
      '../hooks/useLastAttemptFailed.ts',
      '../hooks/usePickupOriginPersistence.ts',
      '../lib/start-code-store.ts',
      '../lib/start-code-record.ts',
      '../lib/start-code-runtime.ts',
      '../lib/cold-start.ts',
      '../lib/trip-screen-mode.ts',
    ];
    for (const file of files) {
      assert.doesNotMatch(source(file), /console\.(warn|error|log|info|debug)/, file);
    }
  });
});

describe('SavedTripView draws only what the saved record knows (HU-CS-02)', () => {
  it('never imports the pieces that would age or lie: driver, ETA, steps, tracking, map, banner', () => {
    for (const forbidden of [
      'DriverCard',
      'DriverTrackingCard',
      'TripStepRail',
      'FreeCancelRail',
      'LastUpdatedHint',
      'NotificationsBanner',
      'MapUnavailableStrip',
      'Skeleton',
      'PriceTag',
      'formatEta',
      'Map,',
      '@rnmapbox/maps',
    ]) {
      assert.equal(savedView.includes(forbidden), false, forbidden);
    }
  });

  it('never receives a driver, a plate, a fare or an estimate as a prop', () => {
    const props = /export interface SavedTripViewProps \{([\s\S]*?)\n\}/.exec(savedView);
    assert.ok(props, 'props are declared');
    assert.deepEqual(
      [...(props[1] as string).matchAll(/^\s+(\w+)\??:/gm)].map((match) => match[1]),
      ['mode', 'code', 'savedAt', 'pickupAddress', 'retrying', 'onRetry', 'testID'],
    );
  });

  it('draws the code card as a saved code, with no plate and no arrival', () => {
    assert.match(savedView, /plate=\{null\}/);
    assert.match(savedView, /arrived=\{false\}/);
    assert.match(savedView, /response: null/);
  });

  it('keeps Cancel visible but disabled, with its reason as text and as hint', () => {
    assert.match(savedView, /disabled\s*\n\s*onPress=\{ignorePress\}/);
    assert.match(savedView, /accessibilityHint=\{cancelReason\}/);
    assert.match(savedView, /testID="saved-trip-cancel-reason"/);
    assert.match(savedView, /testID="cancel-trip-link"/);
  });

  it('offers a single retry button, in outline, with a visible loading label', () => {
    assert.equal((savedView.match(/<Button\b/g) ?? []).length, 1);
    assert.match(savedView, /variant="ghost"/);
    assert.match(savedView, /loadingLabel=\{savedCopy\.retrying\}/);
    assert.match(savedView, /testID="saved-trip-retry"/);
  });

  it('has no exit to the home screen (P-CS-04)', () => {
    assert.doesNotMatch(savedView, /router|continueHome|Seguir al inicio|replace\(/);
  });

  it('shows the pickup point only when it was saved, and only its address', () => {
    assert.match(savedView, /pickupAddress !== null &&/);
    assert.doesNotMatch(savedView, /\.lat\b|\.lng\b|coordinate/i);
  });

  it('warns with an alert notice, in the info tone', () => {
    assert.match(savedView, /tone="info"/);
    assert.match(savedView, /\balert\b\s*\n/);
  });

  it('scrolls, so large text never cuts the retry or the reason off', () => {
    assert.match(savedView, /<ScrollView/);
  });

  it('is built from the tokens, with no literal colors or sizes', () => {
    assert.doesNotMatch(savedView, /#[0-9a-fA-F]{3,8}\b/);
    assert.doesNotMatch(savedView, /(?:padding|margin|gap|fontSize|height|width)\w*: \d/);
  });
});

describe('StartCodeCard status line (D-DX-01, D-DX-02)', () => {
  it('moves the status line under the digits and into the accessible group', () => {
    const digits = startCodeCard.indexOf('start-code-digit-');
    const status = startCodeCard.indexOf('<StatusLine line={statusLine} />');
    const closing = startCodeCard.indexOf('</View>\n    </Card>');
    assert.ok(digits > 0 && status > digits && closing > status);
  });

  it('reads the status as part of the single accessible label', () => {
    assert.match(startCodeCard, /copy\.saved\.accessibility\(/);
    assert.match(startCodeCard, /copy\.saved\.spokenStatus\(/);
  });

  it('hides "Solo lo necesita tu conductor." whenever the code is not the live one', () => {
    assert.match(startCodeCard, /statusLine === null && \(/);
    assert.match(startCodeCard, /copy\.onlyDriverNote/);
  });

  it('shows a spinner for checking, which is not announced, and a drawn glyph otherwise', () => {
    assert.match(startCodeCard, /line\.glyph === 'checking'/);
    assert.match(startCodeCard, /<BrandSpinner/);
    assert.match(startCodeCard, /importantForAccessibility="no-hide-descendants"/);
  });
});

describe('InlineNotice alert (UX 5.3)', () => {
  it('lets an info notice be an alert, and groups title and body in one element', () => {
    assert.match(inlineNotice, /alert\?: boolean/);
    assert.match(inlineNotice, /alert = tone === 'danger'/);
    assert.match(inlineNotice, /accessibilityRole=\{alert \? 'alert' : undefined\}/);
    assert.match(inlineNotice, /\[title, body\]\.filter\(Boolean\)\.join\('\. '\)/);
  });

  it('keeps the action reachable: a notice with an action is not grouped', () => {
    assert.match(inlineNotice, /const grouped = alert && !hasAction/);
  });
});
