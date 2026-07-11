// =============================================================================
// VoyYa Pasajero — useCountdown
// -----------------------------------------------------------------------------
// Cuenta regresiva genérica desde un deadline ISO. Usado por el chip de
// cancelación gratuita (§7.4 de pasajero-estados-borde.md). Puramente de
// presentación — la decisión real de "gratis o no" siempre la confirma el
// servidor en la respuesta de cancelar (no-optimista); esto es solo para que
// el pasajero vea venir el corte antes de tocar "Cancelar".
// =============================================================================

import { useEffect, useState } from 'react';

/** Segundos restantes hasta `deadlineIso` (0 si ya pasó). Se actualiza cada segundo. */
export function useCountdown(deadlineIso: string | null): number {
  const calcular = (): number => {
    if (!deadlineIso) return 0;
    const restanteMs = new Date(deadlineIso).getTime() - Date.now();
    return Math.max(0, Math.floor(restanteMs / 1000));
  };

  const [remainingSec, setRemainingSec] = useState(calcular);

  useEffect(() => {
    setRemainingSec(calcular());
    if (!deadlineIso) return;
    const interval = setInterval(() => setRemainingSec(calcular()), 1000);
    return () => clearInterval(interval);
    // Deliberadamente solo depende de `deadlineIso`: `calcular` se redefine cada
    // render pero su resultado depende únicamente de ese valor y de Date.now().
  }, [deadlineIso]);

  return remainingSec;
}
