export function formatCOP(amount: number): string {
  const integer = Math.round(amount);
  const sign = integer < 0 ? '-' : '';
  const digits = Math.abs(integer).toString();
  const withThousands = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}$${withThousands}`;
}

export function formatMMSS(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatShortDateTime(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month} · ${hours}:${minutes}`;
}
