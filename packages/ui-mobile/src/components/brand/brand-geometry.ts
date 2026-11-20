export const BRAND_BALL_PATH =
  'M100,73 C107.16,73 114.03,75.84 119.09,80.91 C124.16,85.97 127,92.84 127,100 C127,107.16 124.16,114.03 119.09,119.09 C114.03,124.16 107.16,127 100,127 C92.84,127 85.97,124.16 80.91,119.09 C75.84,114.03 73,107.16 73,100 C73,92.84 75.84,85.97 80.91,80.91 C85.97,75.84 92.84,73 100,73 Z';
export const BRAND_TAXI_BODY_PATH =
  'M100,26.2 C136,26.2 141.3,56.8 146.5,68.8 C151.9,71.3 157.6,74 157.6,97 C157.6,113 156.2,117.1 151.98,121.38 C147.7,125.6 125,127 100,127 C75,127 52.3,125.6 48.02,121.38 C43.8,117.1 42.4,113 42.4,97 C42.4,74 48.1,71.3 53.5,68.8 C58.7,56.8 64,26.2 100,26.2 Z';
export const BRAND_WHEEL_BODY_PATH =
  'M100,7 C115.91,7 131.18,13.32 142.43,24.57 C153.68,35.82 160,51.09 160,67 C160,82.91 153.68,98.18 142.43,109.43 C131.18,120.68 115.91,127 100,127 C84.09,127 68.82,120.68 57.57,109.43 C46.32,98.18 40,82.91 40,67 C40,51.09 46.32,35.82 57.57,24.57 C68.82,13.32 84.09,7 100,7 Z';

export const BRAND_VIEWBOX = 200;
export const BRAND_CENTER = 100;
export const BRAND_BALL_RADIUS = 27;
export const BRAND_RING_RADIUS = 47;
export const BRAND_GROUND_Y = 127;

export const BRAND_TAXI_WINDSHIELD_PATH = 'M80.8,33.9 L119.2,33.9 L133.6,64.6 L66.4,64.6 Z';
export const BRAND_TAXI_WINDSHIELD_STROKE = 2.88;
export const BRAND_TAXI_HEADLIGHTS: readonly { cx: number; cy: number }[] = [
  { cx: 64, cy: 94.84 },
  { cx: 136, cy: 94.84 },
];
export const BRAND_TAXI_HEADLIGHT_RADIUS = 9.12;
export const BRAND_TAXI_HEADLIGHT_CENTER_RADIUS = 4.8;
export const BRAND_TAXI_GRILLE = {
  x: 80.8,
  y: 88.6,
  width: 38.4,
  height: 12.48,
  rx: 6.24,
} as const;
export const BRAND_TAXI_ROOF_LIGHT = {
  x: 83.2,
  y: 14.68,
  width: 33.6,
  height: 12,
  rx: 3.84,
} as const;
export const BRAND_TAXI_ROOF_LIGHT_PILL = {
  x: 87.04,
  y: 17.08,
  width: 25.92,
  height: 7.2,
  rx: 3.6,
  stroke: 1.44,
} as const;
export const BRAND_TAXI_ROOF_PIVOT = { cx: 100, cy: 26.7 } as const;

export const BRAND_WHEEL_CENTER = { cx: 100, cy: 67 } as const;
export const BRAND_WHEEL_HOLE_RADIUS = 43.71;
export const BRAND_WHEEL_SPOKES: readonly {
  x: number;
  y: number;
  width: number;
  height: number;
}[] = [
  { x: 50.3, y: 59.71, width: 99.4, height: 14.57 },
  { x: 92.71, y: 67, width: 14.57, height: 49.7 },
];
export const BRAND_WHEEL_HUB_RADIUS = 21.43;
export const BRAND_WHEEL_HUB_CENTER_RADIUS = 7.71;
export const BRAND_WHEEL_MARK = {
  x: 89.71,
  y: 11.93,
  width: 20.57,
  height: 8.57,
  rx: 4.29,
} as const;

export const BRAND_SHADOW_RX = 26;
export const BRAND_SHADOW_RY = 6;
export const BRAND_SHADOW_Y = 130;

export type BrandFigure = 'taxi' | 'wheel';

export const BRAND_FIGURE_BODY: Record<BrandFigure, string> = {
  taxi: BRAND_TAXI_BODY_PATH,
  wheel: BRAND_WHEEL_BODY_PATH,
};

export const BRAND_FIGURE_SHADOW_SPREAD: Record<BrandFigure, number> = {
  taxi: 2.0,
  wheel: 2.0,
};

export interface IconViewBoxInput {
  scale: number;
  iconX: number;
  iconY: number;
  canvasX: number;
  canvasY: number;
}

export interface IconViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function iconViewBox({
  scale,
  iconX,
  iconY,
  canvasX,
  canvasY,
}: IconViewBoxInput): IconViewBox {
  const span = BRAND_VIEWBOX / scale;
  return { x: iconX - canvasX / scale, y: iconY - canvasY / scale, width: span, height: span };
}

export const BRAND_ICON_VIEWBOX: Record<BrandFigure, IconViewBox> = {
  taxi: iconViewBox({ scale: 0.24, iconX: 512, iconY: 730, canvasX: 100, canvasY: 127 }),
  wheel: iconViewBox({ scale: 3 / 14, iconX: 512, iconY: 512, canvasX: 100, canvasY: 67 }),
};
