import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

function source(file: string): string {
  return readFileSync(new URL(`./${file}`, import.meta.url), 'utf8');
}

describe('NotificationsBanner accessibility contract', () => {
  const banner = source('NotificationsBanner.tsx');
  const statusBanner = readFileSync(
    new URL('../../../../packages/ui-mobile/src/components/StatusBanner.tsx', import.meta.url),
    'utf8',
  );

  it('is built on the shared StatusBanner, not on its own card', () => {
    assert.match(banner, /<StatusBanner/);
    assert.doesNotMatch(banner, /<Card/);
  });

  it('makes the dismiss control at least 44 dp in both directions, from the token', () => {
    assert.match(statusBanner, /width: touch\.min/);
    assert.match(statusBanner, /height: touch\.min/);
  });

  it('labels the dismiss control with its own copy and gives it the button role', () => {
    assert.match(banner, /dismissLabel=\{notificationsCopy\.banner\.dismiss\}/);
    assert.match(statusBanner, /accessibilityRole="button"/);
  });

  it('shows a focus ring on the dismiss control for keyboard users', () => {
    assert.match(statusBanner, /colors\.focusRing/);
  });

  it('reads title and body as a single element', () => {
    assert.match(statusBanner, /accessible accessibilityLabel=\{body \?/);
  });

  it('is information, not an emergency: it asks for a polite status and never the alert role', () => {
    assert.match(banner, /role="status"/);
    assert.doesNotMatch(banner, /role="alert"/);
  });

  it('keeps an explicit text action instead of a bare chevron', () => {
    assert.match(banner, /actionLabel=\{view\.actionLabel/);
    assert.match(statusBanner, /<LinkButton/);
  });

  it('has no literal colors', () => {
    assert.doesNotMatch(banner, /#[0-9a-fA-F]{3,8}\b/);
    assert.doesNotMatch(statusBanner, /#[0-9a-fA-F]{3,8}\b/);
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
