export function formatCOP(amount: number): string {
  const integer = Math.round(amount);
  const sign = integer < 0 ? '-' : '';
  const digits = Math.abs(integer).toString();
  const withThousands = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}$${withThousands}`;
}
