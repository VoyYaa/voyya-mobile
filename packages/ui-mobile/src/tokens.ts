// =============================================================================
// VoyYa — Design tokens (packages/ui-mobile)
// -----------------------------------------------------------------------------
// Fuente ÚNICA de los 5 colores de marca + espaciado/tipografía/radios/sombras,
// en modo claro y oscuro. Ningún componente de este paquete hardcodea un color:
// todos consumen estos tokens (vía `useTheme()`). Ver docs/VoyYa/07-ux-design.md
// y docs/VoyYa/ux/{pasajero-estados-borde,conductor-solicitud-asignacion}.md.
// =============================================================================

import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/** Los 5 colores de marca — NO se redefinen ni se reescalan fuera de aquí. */
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
  /** Texto sobre fondo `brand` — SIEMPRE espresso, nunca blanco (no alcanza AA sobre ámbar). */
  onBrand: string;
  success: string;
  onSuccess: string;
  danger: string;
  /** Propuesto en conductor-solicitud-asignacion.md §1.1 — pendiente de confirmación formal. */
  dangerTint: string;
  onDanger: string;
}

// Claro — mapeo 1:1 con §1.1 de conductor-solicitud-asignacion.md
const lightColors: ColorTokens = {
  bg: BRAND_COLORS.crema,
  surface: '#FFFFFF',
  surfaceAlt: '#FCE9C6', // amber-soft
  text: BRAND_COLORS.espresso,
  textMuted: 'rgba(42, 32, 24, 0.7)',
  border: '#EADFC9', // "línea"
  brand: BRAND_COLORS.amber,
  brandPressed: BRAND_COLORS.amberDeep,
  onBrand: BRAND_COLORS.espresso,
  success: BRAND_COLORS.go,
  onSuccess: '#FFFFFF',
  danger: BRAND_COLORS.danger,
  dangerTint: '#F6DED4',
  onDanger: '#FFFFFF',
};

// Oscuro — mismo criterio que la spec de conductor: los 5 colores de marca NO
// cambian de valor, solo el fondo/superficie sobre el que se aplican.
const darkColors: ColorTokens = {
  bg: '#1C140D', // espresso llevado a superficie oscura de pantalla
  surface: BRAND_COLORS.espresso, // un tono más claro que `bg` (separación de capas)
  surfaceAlt: 'rgba(244, 162, 26, 0.14)', // amber-soft a ~14% sobre `surface`
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

/** Táctil mínimo obligatorio (CLAUDE.md — accesibilidad). */
export const touch = { min: 44 } as const;

/** Sombras "cálidas": tinte espresso en vez de negro puro. */
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

// RN no tiene una familia "system-ui" universal: se aproxima con la fuente del
// sistema en cada plataforma, usando la variante *rounded* de Android donde
// existe (Roboto Flex GM3 rounded en Android 12+; cae a sans-serif si no).
const displayFamily = Platform.select({ ios: 'System', android: 'sans-serif-rounded', default: 'System' });
const bodyFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

/**
 * `numeric` añade `fontVariant: ['tabular-nums']` — precios/ETA/OTP no deben
 * "bailar" de ancho al cambiar de dígito (skill frontend-pantalla-rn).
 */
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
