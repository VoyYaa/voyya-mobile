export const NO_BREAK_SPACE = '\u00a0';

export function formatMeters(meters: number): string {
  return `${meters}${NO_BREAK_SPACE}m`;
}
