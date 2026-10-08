import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BRAND_COLORS, darkColors, lightColors, type ColorTokens } from './palette.ts';

type Rgb = readonly [number, number, number];

interface Resolved {
  rgb: Rgb;
  alpha: number;
}

function parseHex(hex: string): Rgb {
  const digits = hex.replace('#', '');
  return [
    parseInt(digits.slice(0, 2), 16),
    parseInt(digits.slice(2, 4), 16),
    parseInt(digits.slice(4, 6), 16),
  ];
}

function parseColor(value: string): Resolved {
  if (value.startsWith('#')) return { rgb: parseHex(value), alpha: 1 };
  const match = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(value);
  if (!match) throw new Error(`Unsupported color: ${value}`);
  return {
    rgb: [Number(match[1]), Number(match[2]), Number(match[3])],
    alpha: Number(match[4]),
  };
}

function compositeOver(foreground: Resolved, background: Resolved): Rgb {
  return [0, 1, 2].map((index) => {
    const front = foreground.rgb[index] ?? 0;
    const back = background.rgb[index] ?? 0;
    return foreground.alpha * front + (1 - foreground.alpha) * back;
  }) as unknown as Rgb;
}

function channelLuminance(channel: number): number {
  const scaled = channel / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb: Rgb): number {
  const [red, green, blue] = rgb;
  return (
    0.2126 * channelLuminance(red) +
    0.7152 * channelLuminance(green) +
    0.0722 * channelLuminance(blue)
  );
}

function contrastRatio(foreground: string, background: string, base: string): number {
  const baseColor = parseColor(base);
  const bg = parseColor(background);
  const fg = parseColor(foreground);
  const bgRgb = bg.alpha < 1 ? compositeOver(bg, baseColor) : bg.rgb;
  const fgRgb = fg.alpha < 1 ? compositeOver(fg, { rgb: bgRgb, alpha: 1 }) : fg.rgb;
  const first = luminance(fgRgb);
  const second = luminance(bgRgb);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

type TokenName = keyof ColorTokens;

interface ContrastPair {
  foreground: TokenName;
  background: TokenName;
  minimum: number;
}

const TEXT = 4.5;
const GRAPHIC = 3;

const LIGHT_PAIRS: readonly ContrastPair[] = [
  { foreground: 'text', background: 'bg', minimum: TEXT },
  { foreground: 'text', background: 'surface', minimum: TEXT },
  { foreground: 'text', background: 'surfaceSunken', minimum: TEXT },
  { foreground: 'textMuted', background: 'bg', minimum: TEXT },
  { foreground: 'textMuted', background: 'surfaceSunken', minimum: TEXT },
  { foreground: 'textMuted', background: 'brandTint', minimum: TEXT },
  { foreground: 'textSubtle', background: 'bg', minimum: TEXT },
  { foreground: 'textSubtle', background: 'surface', minimum: TEXT },
  { foreground: 'textSubtle', background: 'surfaceSunken', minimum: TEXT },
  { foreground: 'onBrand', background: 'brand', minimum: TEXT },
  { foreground: 'onBrand', background: 'brandPressed', minimum: TEXT },
  { foreground: 'brandInk', background: 'bg', minimum: TEXT },
  { foreground: 'brandInk', background: 'brandTint', minimum: TEXT },
  { foreground: 'onSuccess', background: 'success', minimum: TEXT },
  { foreground: 'onSuccessSolid', background: 'successSolid', minimum: TEXT },
  { foreground: 'successInk', background: 'successTint', minimum: TEXT },
  { foreground: 'successInk', background: 'bg', minimum: TEXT },
  { foreground: 'dangerInk', background: 'dangerTint', minimum: TEXT },
  { foreground: 'dangerInk', background: 'bg', minimum: TEXT },
  { foreground: 'onDanger', background: 'dangerSolid', minimum: TEXT },
  { foreground: 'danger', background: 'bg', minimum: GRAPHIC },
  { foreground: 'infoInk', background: 'infoTint', minimum: TEXT },
  { foreground: 'info', background: 'bg', minimum: GRAPHIC },
  { foreground: 'borderStrong', background: 'surface', minimum: GRAPHIC },
  { foreground: 'borderStrong', background: 'bg', minimum: GRAPHIC },
  { foreground: 'borderStrong', background: 'surfaceSunken', minimum: GRAPHIC },
  { foreground: 'focusRing', background: 'bg', minimum: GRAPHIC },
  { foreground: 'onStage', background: 'stage', minimum: TEXT },
  { foreground: 'onStageMuted', background: 'stage', minimum: TEXT },
  { foreground: 'onStageMuted', background: 'stageRaised', minimum: TEXT },
  { foreground: 'brand', background: 'stage', minimum: GRAPHIC },
  { foreground: 'success', background: 'stage', minimum: GRAPHIC },
  { foreground: 'danger', background: 'stage', minimum: GRAPHIC },
];

const DARK_PAIRS: readonly ContrastPair[] = [
  { foreground: 'text', background: 'bg', minimum: TEXT },
  { foreground: 'text', background: 'surface', minimum: TEXT },
  { foreground: 'text', background: 'surfaceRaised', minimum: TEXT },
  { foreground: 'textMuted', background: 'surface', minimum: TEXT },
  { foreground: 'textMuted', background: 'surfaceRaised', minimum: TEXT },
  { foreground: 'textSubtle', background: 'surface', minimum: TEXT },
  { foreground: 'textSubtle', background: 'surfaceRaised', minimum: TEXT },
  { foreground: 'brandInk', background: 'surface', minimum: TEXT },
  { foreground: 'brandInk', background: 'surfaceRaised', minimum: TEXT },
  { foreground: 'brandInk', background: 'brandTint', minimum: TEXT },
  { foreground: 'successInk', background: 'surface', minimum: TEXT },
  { foreground: 'dangerInk', background: 'surface', minimum: TEXT },
  { foreground: 'dangerInk', background: 'surfaceRaised', minimum: TEXT },
  { foreground: 'dangerInk', background: 'dangerTint', minimum: TEXT },
  { foreground: 'infoInk', background: 'surface', minimum: TEXT },
  { foreground: 'borderStrong', background: 'surface', minimum: GRAPHIC },
  { foreground: 'borderStrong', background: 'surfaceRaised', minimum: GRAPHIC },
  { foreground: 'focusRing', background: 'surface', minimum: GRAPHIC },
];

const EXPECTED_BRAND_HEX: Record<string, string> = {
  amber: '#F4A21A',
  amberDeep: '#E0850A',
  amberInk: '#6B4505',
  amberTint: '#FCE9C6',
  espresso: '#2A2018',
  espresso800: '#3A2D21',
  espresso700: '#4A3A2C',
  espresso600: '#5C4A3A',
  espresso500: '#6B5A47',
  crema: '#FBF6ED',
  cremaDeep: '#F3EAD9',
  cremaHairline: '#EADFC9',
  sand: '#8F7F68',
  go: '#12A46A',
  goInk: '#0A6A44',
  goTint: '#DDF1E7',
  danger: '#D6503F',
  dangerSolid: '#B23A2C',
  dangerInk: '#A63325',
  dangerTint: '#F6DED4',
  info: '#2D6A8E',
  infoInk: '#1F5272',
  infoTint: '#DCEBF3',
};

const LEGACY_COLOR_KEYS: readonly TokenName[] = [
  'bg',
  'surface',
  'surfaceAlt',
  'text',
  'textMuted',
  'border',
  'brand',
  'brandPressed',
  'brandInk',
  'onBrand',
  'success',
  'successInk',
  'onSuccess',
  'danger',
  'dangerTint',
  'dangerInk',
  'dangerSolid',
  'onDanger',
  'focusRing',
  'focusHalo',
];

function assertPairs(themeName: string, colors: ColorTokens, pairs: readonly ContrastPair[]): void {
  for (const pair of pairs) {
    const ratio = contrastRatio(colors[pair.foreground], colors[pair.background], colors.surface);
    assert.ok(
      ratio >= pair.minimum,
      `${themeName}: ${pair.foreground} on ${pair.background} is ${ratio.toFixed(2)}, needs ${pair.minimum}`,
    );
  }
}

describe('brand palette contract', () => {
  it('freezes every primitive hex of the v2 token table', () => {
    for (const [name, hex] of Object.entries(EXPECTED_BRAND_HEX)) {
      assert.equal((BRAND_COLORS as Record<string, string>)[name], hex, `BRAND_COLORS.${name}`);
    }
  });

  it('keeps every legacy color token in both themes', () => {
    for (const key of LEGACY_COLOR_KEYS) {
      assert.equal(typeof lightColors[key], 'string', `light.${key}`);
      assert.equal(typeof darkColors[key], 'string', `dark.${key}`);
    }
  });

  it('defines exactly the same token names in light and dark', () => {
    assert.deepEqual(Object.keys(lightColors).sort(), Object.keys(darkColors).sort());
  });

  it('keeps the stage band identical in both themes', () => {
    for (const key of ['stage', 'stageRaised', 'onStage', 'onStageMuted', 'stageLine'] as const) {
      assert.equal(lightColors[key], darkColors[key], key);
    }
  });
});

describe('contrast AA contract', () => {
  it('meets the minimum ratio of every light pair', () => {
    assertPairs('light', lightColors, LIGHT_PAIRS);
  });

  it('meets the minimum ratio of every dark pair', () => {
    assertPairs('dark', darkColors, DARK_PAIRS);
  });

  it('documents that brand amber never works as text on cream', () => {
    const brandOnBg = contrastRatio(lightColors.brand, lightColors.bg, lightColors.surface);
    const pressedOnBg = contrastRatio(
      lightColors.brandPressed,
      lightColors.bg,
      lightColors.surface,
    );
    assert.ok(brandOnBg < GRAPHIC, `brand on bg is ${brandOnBg.toFixed(2)}`);
    assert.ok(pressedOnBg < GRAPHIC, `brandPressed on bg is ${pressedOnBg.toFixed(2)}`);
  });

  it('reproduces the reference ratios of the token table within tolerance', () => {
    const references: ReadonlyArray<readonly [TokenName, TokenName, number]> = [
      ['text', 'bg', 14.8],
      ['onBrand', 'brand', 7.61],
      ['brandInk', 'bg', 7.87],
      ['dangerInk', 'dangerTint', 5.23],
    ];
    for (const [foreground, background, expected] of references) {
      const ratio = contrastRatio(
        lightColors[foreground],
        lightColors[background],
        lightColors.surface,
      );
      assert.ok(
        Math.abs(ratio - expected) < 0.1,
        `${foreground}/${background}: ${ratio.toFixed(2)}`,
      );
    }
  });
});
