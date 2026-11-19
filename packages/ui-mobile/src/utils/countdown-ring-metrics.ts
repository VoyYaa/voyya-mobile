export const RING_COMPACT_SIZE_BELOW = 96;
export const RING_NUMBER_RATIO = 0.29;
export const RING_FONT_SCALE_CAP = 1.3;
export const COMPACT_RING_FONT_SCALE_CAP = 1;

export interface CountdownRingMetrics {
  compact: boolean;
  numberSize: number;
  showUnit: boolean;
  fontScaleCap: number;
}

export function countdownRingMetrics(size: number): CountdownRingMetrics {
  const compact = size < RING_COMPACT_SIZE_BELOW;
  return {
    compact,
    numberSize: Math.round(size * RING_NUMBER_RATIO),
    showUnit: !compact,
    fontScaleCap: compact ? COMPACT_RING_FONT_SCALE_CAP : RING_FONT_SCALE_CAP,
  };
}
