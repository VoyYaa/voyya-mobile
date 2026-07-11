// =============================================================================
// VoyYa Conductor — useTurnoStore (Zustand)
// -----------------------------------------------------------------------------
// Estado de UI LOCAL "en turno / fuera de turno" (coding-standards.md: Zustand
// SOLO para UI local; el estado de servidor real vive en TanStack Query). Este
// ciclo lo mantiene deliberadamente local (sin llamar a un endpoint): no se
// encontró en `apps/api` un endpoint dedicado para alternar el turno del
// conductor (el dominio SÍ contempla `fuera_de_turno` en `EstadoConductor` de
// @voyya/shared, pero no hay `PATCH /conductores/:id/turno` todavía) — cuando
// exista, este store pasa a sincronizar con el servidor sin cambiar el resto de
// la app (las pantallas ya leen `enTurno` de aquí, no de un fetch propio).
//
// KISS: no se persiste entre sesiones (arranca "fuera de turno" siempre) — no
// hay spec que pida recordar el turno tras cerrar la app.
// =============================================================================

import { create } from 'zustand';

interface TurnoState {
  enTurno: boolean;
  activarTurno: () => void;
  desactivarTurno: () => void;
  alternarTurno: () => void;
}

export const useTurnoStore = create<TurnoState>((set) => ({
  enTurno: false,
  activarTurno: () => set({ enTurno: true }),
  desactivarTurno: () => set({ enTurno: false }),
  alternarTurno: () => set((s) => ({ enTurno: !s.enTurno })),
}));
