// =============================================================================
// VoyYa Pasajero — useCoverageGate
// -----------------------------------------------------------------------------
// Determina si la UBICACIÓN ACTUAL del pasajero está dentro de cobertura, para
// el panel bloqueante de Home (§5.2 de pasajero-estados-borde.md).
//
// Nota de diseño (limitación conocida del contrato — reportar a `arquitectura`):
// `CotizarTarifaDTO`/`ErrorTrips` no distinguen si el punto fuera de polígono
// es el ORIGEN o el DESTINO (un solo código `FUERA_DE_COBERTURA`, sin campo que
// indique cuál). Como `packages/shared` es de solo lectura en este ciclo y no
// existe un endpoint dedicado "verificar cobertura de un punto", este hook
// reusa `POST /trips/cotizar` con origen = destino = ubicación actual: es una
// llamada real y válida contra el contrato existente, cuyo ÚNICO propósito
// aquí es leer si esa coordenada cae dentro del polígono, no obtener una
// cotización real. Cuando exista un endpoint de cobertura dedicado, este hook
// se reemplaza sin tocar el resto de Home (aislado a propósito).
// =============================================================================

import { useEffect, useState } from 'react';
import type { Ubicacion } from '@voyya/shared';
import { cotizarTarifa } from '../api/trips.api';
import { codigoErrorDominio, esErrorDeRed } from '../api/errors';

export type CoverageGateStatus = 'verificando' | 'dentro' | 'fuera' | 'error';

export interface CoverageGate {
  status: CoverageGateStatus;
  reintentar: () => void;
}

export function useCoverageGate(origen: Ubicacion, idMunicipio: number): CoverageGate {
  const [status, setStatus] = useState<CoverageGateStatus>('verificando');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setStatus('verificando');

    cotizarTarifa({ origen, destino: origen, id_municipio: idMunicipio, tipo_servicio: 'taxi' })
      .then(() => {
        if (vigente) setStatus('dentro');
      })
      .catch((error: unknown) => {
        if (!vigente) return;
        if (esErrorDeRed(error)) {
          // Sin conexión: no bloqueamos Home por esto — el OfflineBanner global
          // ya cubre la comunicación de "sin conexión" en toda la pantalla.
          setStatus('dentro');
          return;
        }
        setStatus(codigoErrorDominio(error) === 'FUERA_DE_COBERTURA' ? 'fuera' : 'error');
      });

    return () => {
      vigente = false;
    };
  }, [origen.lat, origen.lng, idMunicipio, intento]);

  return { status, reintentar: () => setIntento((n) => n + 1) };
}
