import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = readFileSync(new URL('./OtpInput.tsx', import.meta.url), 'utf8');

describe('OtpInput accessibility contract', () => {
  it('exposes one accessible element, the real field, with its label and its value', () => {
    assert.match(
      source,
      /accessibilityLabel=\{accessibilityLabel \?\? `Código de verificación de \$\{length\} dígitos`\}/,
    );
    assert.match(
      source,
      /accessibilityValue=\{\{ text: `\$\{value\.length\} de \$\{length\} dígitos ingresados` \}\}/,
    );
  });

  it('hides the drawn boxes from the screen reader', () => {
    assert.match(source, /accessibilityElementsHidden/);
    assert.match(source, /importantForAccessibility="no-hide-descendants"/);
  });

  it('tells the screen reader when the field is disabled or busy', () => {
    assert.match(source, /accessibilityState=\{\{ disabled, busy: status === 'verifying' \}\}/);
  });

  it('covers the whole group with the field, so the touch target is the group and not one box', () => {
    assert.match(source, /position: 'absolute', top: 0, left: 0, right: 0, bottom: 0/);
  });
});

describe('OtpInput layout contract', () => {
  it('measures its own width and draws the group hidden until it knows it', () => {
    assert.match(source, /onLayout=\{handleLayout\}/);
    assert.match(source, /availableWidth === null \? 0/);
  });

  it('stretches to the column, so the measure is the width the screen offers', () => {
    assert.match(source, /alignSelf: 'stretch'/);
  });

  it('takes the size of every box from the pure fit function, never from a literal', () => {
    assert.match(source, /fitOtpBoxes\(length, /);
    assert.match(source, /width=\{layout\.boxWidth\}/);
    assert.match(source, /gap: layout\.boxGap/);
  });

  it('keeps the digit inside the box with the same cap of 1.3 times as the buttons', () => {
    assert.match(source, /DIGIT_MAX_FONT_MULTIPLIER = 1\.3/);
    assert.match(source, /maxFontSizeMultiplier=\{DIGIT_MAX_FONT_MULTIPLIER\}/);
    assert.match(source, /adjustsFontSizeToFit/);
    assert.match(source, /numberOfLines=\{1\}/);
  });

  it('keeps four boxes as the default length, which is the one of the start code of the driver', () => {
    assert.match(source, /DEFAULT_LENGTH = 4/);
    assert.match(source, /length = DEFAULT_LENGTH/);
  });
});

describe('OtpInput entry contract', () => {
  it('has no native maxLength, because it cuts a pasted code before the filter runs', () => {
    assert.doesNotMatch(source, /maxLength/);
  });

  it('filters and cuts what is typed or pasted with the pure entry rule', () => {
    assert.match(source, /applyOtpEntry\(value, raw, length\)/);
  });

  it('shows the focus on the last box when the code is full', () => {
    assert.match(source, /Math\.min\(value\.length, length - 1\)/);
  });

  it('dims the whole group when it is disabled while editing, and in no other state', () => {
    assert.match(source, /const dimmed = disabled && status === 'editing'/);
    assert.match(source, /DISABLED_OPACITY = 0\.5/);
  });

  it('tells the screen when the shake and the clearing end', () => {
    assert.match(source, /onErrorSettledRef\.current\?\.\(\)/);
  });

  it('lets the screen focus the field', () => {
    assert.match(
      source,
      /useImperativeHandle\(ref, \(\) => \(\{ focus: \(\) => inputRef\.current\?\.focus\(\) \}\)/,
    );
  });

  it('uses no literal colors', () => {
    assert.doesNotMatch(source, /#[0-9a-fA-F]{3,8}\b/);
  });
});
