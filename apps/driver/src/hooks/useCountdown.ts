// =============================================================================
// VoyYa Conductor — useCountdown
// -----------------------------------------------------------------------------
// Cuenta regresiva AUTORITATIVA DEL SERVIDOR: se deriva de `deadlineIso`
// (`NotificacionAsignacion.expira_en`), nunca de "15 menos el tiempo desde que
// se montó la pantalla" (§3.2 — dos conductores no deben ver tiempos distintos
// para la misma solicitud).
//
// `frozen`: cuando es `true`, deja de re-calcular (el valor devuelto queda fijo
// en el último tick) — implementa "el anillo se congela en el valor exacto del
// tap, no sigue bajando ni se resetea" (§3.4.2) sin necesitar estado adicional:
// simplemente se deja de programar el próximo tick.
// =============================================================================

import { useEffect, useState } from 'react';

function calcularRestante(deadlineIso: string | null): number {
  if (!deadlineIso) return 0;
  const restanteMs = new Date(deadlineIso).getTime() - Date.now();
  return Math.max(0, Math.floor(restanteMs / 1000));
}

export function useCountdown(deadlineIso: string | null, frozen = false): number {
  const [remainingSec, setRemainingSec] = useState(() => calcularRestante(deadlineIso));

  useEffect(() => {
    if (frozen) return; // no reanuda el conteo ni resetea mientras está congelado.
    setRemainingSec(calcularRestante(deadlineIso));
    if (!deadlineIso) return;
    const interval = setInterval(() => setRemainingSec(calcularRestante(deadlineIso)), 1000);
    return () => clearInterval(interval);
  }, [deadlineIso, frozen]);

  return remainingSec;
}
