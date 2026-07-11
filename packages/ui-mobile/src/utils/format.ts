// =============================================================================
// VoyYa — Formato de moneda COP (packages/ui-mobile)
// -----------------------------------------------------------------------------
// Separador de miles con punto ("$6.000"), sin depender de datos ICU de Intl
// (evita inconsistencias entre motores JS/Hermes). Determinístico y testeable.
// =============================================================================

export function formatCOP(amount: number): string {
  const entero = Math.round(amount);
  const signo = entero < 0 ? '-' : '';
  const digitos = Math.abs(entero).toString();
  const conMiles = digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${signo}$${conMiles}`;
}
