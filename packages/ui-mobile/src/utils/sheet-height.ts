export const SHEET_TOP_MARGIN = 16;
export const DEFAULT_STATUS_BAR_HEIGHT = 24;

export interface SheetMaxHeightInput {
  windowHeight: number;
  keyboardHeight: number;
  statusBarHeight: number | null | undefined;
}

export function sheetMaxHeight({
  windowHeight,
  keyboardHeight,
  statusBarHeight,
}: SheetMaxHeightInput): number {
  const topClearance = (statusBarHeight ?? DEFAULT_STATUS_BAR_HEIGHT) + SHEET_TOP_MARGIN;
  return Math.max(0, windowHeight - Math.max(0, keyboardHeight) - topClearance);
}

export function sheetBottomPadding(
  keyboardHeight: number,
  restingPadding: number,
  keyboardPadding: number,
): number {
  return keyboardHeight > 0 ? Math.min(restingPadding, keyboardPadding) : restingPadding;
}
