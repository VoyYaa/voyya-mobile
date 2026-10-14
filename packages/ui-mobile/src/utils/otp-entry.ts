const PASTE_MIN_GROWTH = 2;

export function applyOtpEntry(previous: string, raw: string, length: number): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length <= length) return digits;
  const pasted = digits.length - previous.length >= PASTE_MIN_GROWTH;
  return pasted ? digits.slice(-length) : digits.slice(0, length);
}
