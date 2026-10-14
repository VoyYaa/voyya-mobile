import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

function source(file: string): string {
  return readFileSync(new URL(`./${file}`, import.meta.url), 'utf8');
}

describe('NotificationsBanner accessibility contract', () => {
  const banner = source('NotificationsBanner.tsx');

  it('makes the dismiss control at least 44 dp in both directions, from the token', () => {
    assert.match(banner, /width: theme\.touch\.min/);
    assert.match(banner, /height: theme\.touch\.min/);
  });

  it('labels the dismiss control and gives it the button role', () => {
    assert.match(banner, /accessibilityRole="button"/);
    assert.match(banner, /accessibilityLabel=\{notificationsCopy\.banner\.dismiss\}/);
  });

  it('shows a focus ring on the dismiss control for keyboard users', () => {
    assert.match(banner, /theme\.colors\.focusRing/);
  });

  it('hides the decorative glyph from the screen reader', () => {
    assert.match(banner, /accessibilityElementsHidden/);
    assert.match(banner, /importantForAccessibility="no-hide-descendants"/);
  });

  it('reads title and body as a single element', () => {
    assert.match(banner, /accessible accessibilityLabel=\{view\.accessibilityLabel\}/);
  });

  it('is information, not an emergency, so it never uses the alert role', () => {
    assert.doesNotMatch(banner, /accessibilityRole="alert"/);
  });

  it('uses a 44 dp action button on the dark surface, where the default link text would vanish', () => {
    assert.match(banner, /size="sm"/);
    assert.match(banner, /variant="ghostOnStage"/);
  });

  it('is built on the stage card, with no literal colors', () => {
    assert.match(banner, /tone="stage"/);
    assert.doesNotMatch(banner, /#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('NotificationsPromptSheet accessibility contract', () => {
  const sheet = source('NotificationsPromptSheet.tsx');

  it('keeps both decisions as large buttons, with the same weight for "Ahora no"', () => {
    assert.match(sheet, /size="lg"/);
    assert.doesNotMatch(sheet, /size="sm"/);
  });

  it('gives the accept button a hint about the system dialog', () => {
    assert.match(sheet, /accessibilityHint=\{copy\.acceptHint\}/);
  });

  it('cannot be closed while the permission is being asked', () => {
    assert.match(sheet, /onClose=\{loading \? ignore : onDecline\}/);
    assert.match(sheet, /disabled=\{loading\}/);
  });

  it('scrolls the body and keeps the buttons fixed, so a large font never cuts them', () => {
    assert.match(sheet, /<ScrollView/);
    assert.match(sheet, /maxHeight: bodyMaxHeight/);
  });

  it('makes the policy link at least 44 dp tall, with margin for pixel rounding, from the token', () => {
    const link = sheet.slice(
      sheet.indexOf('<LinkButton'),
      sheet.indexOf('/>', sheet.indexOf('<LinkButton')),
    );
    assert.ok(link.includes('style={{ minHeight: theme.touch.comfortable }}'));
    assert.ok(link.includes('accessibilityHint={policy.fullPolicyHint}'));
  });

  it('shows the identifier line in the scrolling body, after the note and before the policy link', () => {
    const body = sheet.slice(sheet.indexOf('<ScrollView'), sheet.indexOf('</ScrollView>'));
    const note = body.indexOf('copy.note');
    const dataNote = body.indexOf('copy.dataNote');
    const link = body.indexOf('<LinkButton');
    assert.ok(note >= 0 && dataNote > note && link > dataNote);
    assert.equal(sheet.slice(sheet.indexOf('</ScrollView>')).includes('copy.dataNote'), false);
  });

  it('gives the identifier line the same role and type as the rest of the body: plain small text', () => {
    const dataNote = sheet.indexOf('copy.dataNote');
    const text = sheet.slice(sheet.lastIndexOf('<Text', dataNote), dataNote);
    assert.ok(text.includes('theme.typography.small'));
    assert.ok(text.includes('theme.colors.textMuted'));
    assert.equal(text.includes('accessibilityRole'), false);
  });

  it('tells a screen reader that the body scrolls, so the identifier line and the link are found', () => {
    const scroll = sheet.slice(
      sheet.indexOf('<ScrollView'),
      sheet.indexOf('>', sheet.indexOf('<ScrollView')),
    );
    assert.ok(scroll.includes('persistentScrollbar'));
    assert.ok(scroll.includes('accessibilityHint={uiCopy.consentScrollHint}'));
  });

  it('shows the policy link only when the policy URL is real', () => {
    assert.match(sheet, /HAS_REAL_POLICY_URL &&/);
  });

  it('has no literal colors', () => {
    assert.doesNotMatch(sheet, /#[0-9a-fA-F]{3,8}\b/);
  });
});
