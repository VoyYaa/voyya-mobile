export const ORNAMENT_MARGIN_DP = 16;

export interface OrnamentPositions {
  logo: { left: number; bottom: number };
  attribution: { right: number; bottom: number };
}

export function ornamentPositions(coveredBottomDp = 0): OrnamentPositions {
  const bottom = ORNAMENT_MARGIN_DP + Math.max(0, Math.round(coveredBottomDp));
  return {
    logo: { left: ORNAMENT_MARGIN_DP, bottom },
    attribution: { right: ORNAMENT_MARGIN_DP, bottom },
  };
}
