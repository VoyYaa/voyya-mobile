const COARSE_DECIMALS = 3;
const FACTOR = 10 ** COARSE_DECIMALS;

export interface CoordinatePair {
  lat: number;
  lng: number;
}

function roundCoarse(value: number): number {
  const rounded = Math.round(value * FACTOR) / FACTOR;
  return rounded === 0 ? 0 : rounded;
}

export function toCoarseCoordinate(coordinate: CoordinatePair): CoordinatePair {
  return { lat: roundCoarse(coordinate.lat), lng: roundCoarse(coordinate.lng) };
}
