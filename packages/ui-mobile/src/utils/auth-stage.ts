export const AUTH_STAGE_CONTENT_MIN_DP = 148;

export function authStageMinHeight(topInset: number): number {
  return Math.max(0, topInset) + AUTH_STAGE_CONTENT_MIN_DP;
}
