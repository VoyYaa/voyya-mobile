// =============================================================================
// VoyYa Pasajero — useTripDraftStore (Zustand)
// -----------------------------------------------------------------------------
// Estado de UI LOCAL del flujo solicitud→confirmación (coding-standards.md:
// Zustand SOLO para UI local; el estado de servidor real vive en TanStack
// Query vía los hooks de `src/hooks`). Aquí solo se recuerda QUÉ eligió el
// pasajero mientras navega entre pantallas — origen/destino/tipo de servicio/
// la última cotización — para no repetir llamadas ni perder contexto al
// volver atrás. Nada de esto se persiste entre sesiones (KISS: no hay
// carrito ni checkout multi-sesión que justifique storage).
// =============================================================================

import { create } from 'zustand';
import type { CotizacionRespuesta, TipoServicio, Ubicacion } from '@voyya/shared';

interface TripDraftState {
  origen: Ubicacion | null;
  destino: Ubicacion | null;
  tipoServicio: TipoServicio;
  idMunicipio: number;
  cotizacion: CotizacionRespuesta | null;
  /** Timestamp local (ISO) de la primera vez que la pantalla vio `estado === 'asignada'`.
   *  Aproximación de UI para el chip de cancelación gratuita (ver constants/parametros.ts). */
  asignadaEnLocal: string | null;

  setOrigenDestino: (origen: Ubicacion, destino: Ubicacion) => void;
  setTipoServicio: (tipo: TipoServicio) => void;
  setCotizacion: (cotizacion: CotizacionRespuesta) => void;
  marcarAsignadaLocal: () => void;
  reset: () => void;
}

const ID_MUNICIPIO_YARUMAL = 1; // Piloto: 1 empresa · 1 municipio (Yarumal) — CLAUDE.md.

export const useTripDraftStore = create<TripDraftState>((set, get) => ({
  origen: null,
  destino: null,
  tipoServicio: 'taxi',
  idMunicipio: ID_MUNICIPIO_YARUMAL,
  cotizacion: null,
  asignadaEnLocal: null,

  setOrigenDestino: (origen, destino) => set({ origen, destino }),
  setTipoServicio: (tipoServicio) => set({ tipoServicio }),
  setCotizacion: (cotizacion) => set({ cotizacion }),
  marcarAsignadaLocal: () => {
    if (!get().asignadaEnLocal) {
      set({ asignadaEnLocal: new Date().toISOString() });
    }
  },
  reset: () =>
    set({
      origen: null,
      destino: null,
      tipoServicio: 'taxi',
      cotizacion: null,
      asignadaEnLocal: null,
    }),
}));
