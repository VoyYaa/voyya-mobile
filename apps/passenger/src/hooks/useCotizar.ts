// =============================================================================
// VoyYa Pasajero — useCotizar
// -----------------------------------------------------------------------------
// POST /trips/cotizar. Es una MUTACIÓN (acción disparada por el usuario o por
// un cambio de tipo de servicio), no una query declarativa: el pasajero decide
// cuándo recotizar (destino elegido, tipo de servicio cambiado).
// =============================================================================

import { useMutation } from '@tanstack/react-query';
import type { CotizarTarifaDTO } from '@voyya/shared';
import { cotizarTarifa } from '../api/trips.api';

export function useCotizar() {
  return useMutation({
    mutationFn: (dto: CotizarTarifaDTO) => cotizarTarifa(dto),
    retry: false,
  });
}
