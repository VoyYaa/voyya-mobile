import { Easing, Platform, type TextStyle, type ViewStyle } from 'react-native';
import { BRAND_COLORS, darkColors, lightColors, type ColorTokens } from './palette';
import { BRAND_FONT_FAMILY, type BrandFontWeight } from './fonts/brand-font-families';

export { BRAND_COLORS, type ColorTokens };

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  x3l: 40,
  x4l: 56,
  gutter: 20,
} as const;

export const radius = {
  field: 14,
  button: 16,
  card: 20,
  sheet: 28,
  chip: 12,
  pill: 999,
} as const;

export const touch = { min: 44, comfortable: 52, primary: 60 } as const;

export const shadow = {
  sm: {
    shadowColor: BRAND_COLORS.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  } satisfies ViewStyle,
  md: {
    shadowColor: BRAND_COLORS.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  } satisfies ViewStyle,
  lg: {
    shadowColor: BRAND_COLORS.espresso,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  } satisfies ViewStyle,
} as const;

export const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export const motion = {
  dur: {
    instant: 0,
    fast: 120,
    base: 200,
    enter: 320,
    hero: 420,
    draw: 600,
    pulse: 2400,
    sweep: 2600,
    spin: 900,
    tick: 1000,
  },
  ease: {
    out: Easing.bezier(0.22, 1, 0.36, 1),
    inOut: Easing.bezier(0.65, 0, 0.35, 1),
    linear: Easing.linear,
  },
  stagger: 60,
  staggerMax: 4,
  pressScale: 0.97,
  reducedFadeMs: 150,
} as const;

const WEIGHT_VALUE: Record<BrandFontWeight, NonNullable<TextStyle['fontWeight']>> = {
  400: '400',
  700: '700',
  800: '800',
  900: '900',
};

function fontStyle(
  weight: BrandFontWeight,
  fontsReady: boolean,
): Pick<TextStyle, 'fontFamily' | 'fontWeight'> {
  if (fontsReady) return { fontFamily: BRAND_FONT_FAMILY[weight] };
  if (Platform.OS === 'android') {
    if (weight === 900) return { fontFamily: 'sans-serif-black' };
    return { fontFamily: 'sans-serif', fontWeight: WEIGHT_VALUE[weight] };
  }
  return { fontFamily: 'System', fontWeight: WEIGHT_VALUE[weight] };
}

export interface TypographyTokens {
  display: TextStyle;
  headline: TextStyle;
  title: TextStyle;
  subtitle: TextStyle;
  body: TextStyle;
  bodyStrong: TextStyle;
  small: TextStyle;
  smallStrong: TextStyle;
  eyebrow: TextStyle;
  button: TextStyle;
  numeric: TextStyle;
  numericXL: TextStyle;
  timer: TextStyle;
}

export function buildTypography(fontsReady: boolean): TypographyTokens {
  return {
    display: {
      ...fontStyle(900, fontsReady),
      fontSize: 34,
      lineHeight: 36,
      letterSpacing: -0.85,
    },
    headline: {
      ...fontStyle(800, fontsReady),
      fontSize: 26,
      lineHeight: 30,
      letterSpacing: -0.52,
    },
    title: {
      ...fontStyle(800, fontsReady),
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: -0.33,
    },
    subtitle: { ...fontStyle(700, fontsReady), fontSize: 17, lineHeight: 22 },
    body: { ...fontStyle(400, fontsReady), fontSize: 16, lineHeight: 23 },
    bodyStrong: { ...fontStyle(700, fontsReady), fontSize: 16, lineHeight: 23 },
    small: { ...fontStyle(400, fontsReady), fontSize: 14, lineHeight: 19 },
    smallStrong: { ...fontStyle(700, fontsReady), fontSize: 14, lineHeight: 19 },
    eyebrow: {
      ...fontStyle(800, fontsReady),
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 1.44,
      textTransform: 'uppercase',
    },
    button: { ...fontStyle(800, fontsReady), fontSize: 17, lineHeight: 20 },
    numeric: { ...fontStyle(900, fontsReady), fontVariant: ['tabular-nums'] },
    numericXL: {
      ...fontStyle(900, fontsReady),
      fontSize: 40,
      lineHeight: 44,
      letterSpacing: -0.8,
      fontVariant: ['tabular-nums'],
    },
    timer: {
      ...fontStyle(900, fontsReady),
      fontSize: 64,
      lineHeight: 64,
      letterSpacing: -1.92,
      fontVariant: ['tabular-nums'],
    },
  };
}

export const typography: TypographyTokens = buildTypography(false);

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  fontsReady: boolean;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: typeof shadow;
  typography: TypographyTokens;
  touch: typeof touch;
  motion: typeof motion;
}

export function buildTheme(mode: ThemeMode, fontsReady = false): Theme {
  return {
    mode,
    fontsReady,
    colors: mode === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    shadow,
    typography: buildTypography(fontsReady),
    touch,
    motion,
  };
}
