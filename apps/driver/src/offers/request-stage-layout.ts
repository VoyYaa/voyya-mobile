export const REQUEST_STAGE_HEIGHT_SHARE = 0.46;
export const RING_SIZE_MIN = 96;
export const RING_SIZE_MAX = 220;
export const RING_COMPACT_BELOW = 120;
export const COMPACT_RING_SIZE = 72;

export interface RequestStageLayoutInput {
  windowHeight: number;
  topInset: number;
  fixedHeight: number;
}

export interface RequestStageLayout {
  stageMaxHeight: number;
  freeHeight: number;
  ringSize: number;
  compact: boolean;
}

export function requestStageLayout({
  windowHeight,
  topInset,
  fixedHeight,
}: RequestStageLayoutInput): RequestStageLayout {
  const stageMaxHeight = Math.round(Math.max(0, windowHeight) * REQUEST_STAGE_HEIGHT_SHARE);
  const freeHeight = Math.max(0, stageMaxHeight - Math.max(0, topInset) - Math.max(0, fixedHeight));
  const compact = freeHeight < RING_COMPACT_BELOW;
  const ringSize = compact
    ? COMPACT_RING_SIZE
    : Math.min(RING_SIZE_MAX, Math.max(RING_SIZE_MIN, Math.round(freeHeight)));
  return { stageMaxHeight, freeHeight, ringSize, compact };
}
