import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { uiCopy } from '../copy.ts';
import {
  DEMO_TAG_HEIGHT,
  DEMO_TAG_MAX_FONT_MULTIPLIER,
  demoTagA11y,
  demoTagContainerMinHeight,
} from './demo-tag.ts';

const tagSource = readFileSync(
  new URL('../components/DemoSessionTag.tsx', import.meta.url),
  'utf8',
);
const sheetSource = readFileSync(
  new URL('../components/DemoInfoSheet.tsx', import.meta.url),
  'utf8',
);
const accountSource = readFileSync(
  new URL('../components/AccountSheet.tsx', import.meta.url),
  'utf8',
);

describe('demoTagA11y', () => {
  it('is a button with the label and the hint it is given', () => {
    assert.deepEqual(demoTagA11y('Etiqueta', 'Pista'), {
      accessibilityRole: 'button',
      accessibilityLabel: 'Etiqueta',
      accessibilityHint: 'Pista',
    });
  });

  it('allows no hint', () => {
    assert.equal(demoTagA11y('Etiqueta').accessibilityHint, undefined);
  });
});

describe('DemoSessionTag size', () => {
  it('draws a 32 dp pill inside a container of at least the minimum touch target', () => {
    assert.equal(DEMO_TAG_HEIGHT, 32);
    assert.equal(demoTagContainerMinHeight(44), 44);
    assert.ok(demoTagContainerMinHeight(44) >= 44);
  });

  it('keeps the container minimum even if the touch token shrank below the pill', () => {
    assert.equal(demoTagContainerMinHeight(20), DEMO_TAG_HEIGHT);
  });

  it('grows with the font and never truncates the text', () => {
    assert.equal(DEMO_TAG_MAX_FONT_MULTIPLIER, 1.3);
    assert.match(tagSource, /minHeight: demoTagContainerMinHeight\(theme\.touch\.min\)/);
    assert.doesNotMatch(tagSource, /numberOfLines/);
    assert.doesNotMatch(tagSource, /ellipsizeMode/);
  });
});

describe('DemoSessionTag contract', () => {
  it('uses only existing info tokens, with the focus ring', () => {
    assert.match(tagSource, /theme\.colors\.infoTint/);
    assert.match(tagSource, /theme\.colors\.infoInk/);
    assert.match(tagSource, /theme\.colors\.info\b/);
    assert.match(tagSource, /theme\.colors\.focusRing/);
  });

  it('does not animate when the user asks for reduced motion', () => {
    assert.match(tagSource, /pressed && !reduced/);
  });

  it('does no network and never floats over the map', () => {
    assert.doesNotMatch(tagSource, /position: 'absolute'/);
    assert.doesNotMatch(tagSource, /fetch|useQuery/);
  });
});

describe('DemoInfoSheet contract', () => {
  it('lists the points with the list role and closes with one large button', () => {
    assert.match(sheetSource, /accessibilityRole="list"/);
    assert.match(sheetSource, /size="lg" onPress=\{onClose\}/);
  });

  it('has no links out', () => {
    assert.doesNotMatch(sheetSource, /Linking|LinkButton/);
  });
});

describe('uiCopy.demo', () => {
  it('has the six generic keys', () => {
    assert.deepEqual(Object.keys(uiCopy.demo).sort(), [
      'accountNote',
      'infoOk',
      'infoTitle',
      'tagAccessibility',
      'tagHint',
      'tagLabel',
    ]);
  });

  it('never calls anything official', () => {
    assert.doesNotMatch(JSON.stringify(uiCopy.demo), /oficial/i);
  });
});

describe('AccountSheet demo note', () => {
  it('shows the note under the name, only when one is given', () => {
    assert.match(accountSource, /demoNote\?: string/);
    assert.match(accountSource, /demoNote \? \(/);
    assert.match(accountSource, /testID="account-demo-note"/);
  });
});
