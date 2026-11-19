export type MapStyleMode = 'light' | 'dark';

export interface MapStyleEnv {
  light?: string;
  dark?: string;
}

export interface StockMapStyles {
  light: string;
  dark: string;
}

const CUSTOM_STYLE_PATTERN = /^mapbox:\/\/styles\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function resolveMapStyleUrl(
  mode: MapStyleMode,
  env: MapStyleEnv,
  stock: StockMapStyles,
): string {
  const custom = env[mode]?.trim();
  return custom && CUSTOM_STYLE_PATTERN.test(custom) ? custom : stock[mode];
}
