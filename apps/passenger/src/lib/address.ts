export const PICKUP_REFERENCE_MAX_LENGTH = 120;

export function composeAddress(label: string, reference: string): string {
  const trimmed = reference.trim().slice(0, PICKUP_REFERENCE_MAX_LENGTH);
  return trimmed ? `${label} — ${trimmed}` : label;
}
