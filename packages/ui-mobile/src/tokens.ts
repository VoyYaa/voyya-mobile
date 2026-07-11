import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const BRAND_COLORS = {
  amber: '#F4A21A',
  amberDeep: '#E0850A',
  espresso: '#2A2018',
  crema: '#FBF6ED',
  go: '#12A46A',
  danger: '#D6503F',
} as const;

export interface ColorTokens {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  brand: string;
  brandPressed: string;
  onBrand: string;
  success: string;
  onSuccess: string;
  danger: string;
  dangerTint: string;
  onDanger: string;
}

const lightColors: ColorTokens = {
  bg: BRAND_COLORS.crema,
  surface: '#FFFFFF',
  surfaceAlt: '#FCE9C6',
  text: BRAND_COLORS.espresso,
  textMuted: 'rgba(42, 32, 24, 0.7)',
  border: '#EADFC9',
  brand: BRAND_COLORS.amber,
  brandPressed: BRAND_COLORS.amberDeep,
  onBrand: BRAND_COLORS.espresso,
  success: BRAND_COLORS.go,
  onSuccess: '#FFFFFF',
  danger: BRAND_COLORS.danger,
  dangerTint: '#F6DED4',
  onDanger: '#FFFFFF',
};

const darkColors: ColorTokens = {
  bg: '#1C140D',
  surface: BRAND_COLORS.espresso,
  surfaceAlt: 'rgba(244, 162, 26, 0.14)',
  text: BRAND_COLORS.crema,
  textMuted: 'rgba(251, 246, 237, 0.7)',
  border: 'rgba(234, 223, 201, 0.16)',
  brand: BRAND_COLORS.amber,
  brandPressed: BRAND_COLORS.amberDeep,
  onBrand: BRAND_COLORS.espresso,
  success: BRAND_COLORS.go,
  onSuccess: '#FFFFFF',
  danger: BRAND_COLORS.danger,
  dangerTint: 'rgba(214, 80, 63, 0.18)',
  onDanger: '#FFFFFF',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = {
  field: 12,
  button: 14,
  card: 16,
  sheet: 22,
  pill: 999,
} as const;

export const touch = { min: 44 } as const;

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

const displayFamily = Platform.select({ ios: 'System', android: 'sans-serif-rounded', default: 'System' });
const bodyFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

export const typography = {
  title: {
    fontFamily: displayFamily,
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
  } satisfies TextStyle,
  subtitle: {
    fontFamily: displayFamily,
    fontWeight: '600',
    fontSize: 17,
    lineHeight: 22,
  } satisfies TextStyle,
  body: {
    fontFamily: bodyFamily,
    fontWeight: '400',
    fontSize: 15,
    lineHeight: 21,
  } satisfies TextStyle,
  small: {
    fontFamily: bodyFamily,
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 18,
  } satisfies TextStyle,
  button: {
    fontFamily: displayFamily,
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
  } satisfies TextStyle,
  numeric: {
    fontFamily: bodyFamily,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
} as const;

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: typeof shadow;
  typography: typeof typography;
  touch: typeof touch;
}

export function buildTheme(mode: ThemeMode): Theme {
  return {
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    shadow,
    typography,
    touch,
  };
}
