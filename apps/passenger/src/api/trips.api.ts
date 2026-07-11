// =============================================================================
// VoyYa Pasajero — API del dominio TRIPS
// -----------------------------------------------------------------------------
// Funciones finas 1:1 con el contrato de `@voyya/shared/contracts/trips`. Cada
// función VALIDA el body con el DTO Zod antes de enviarlo (defensa en
// profundidad — el formulario ya debería garantizarlo) y valida la respuesta
// con el esquema de respuesta correspondiente. No se redefine ningún tipo:
// cada nombre importado (p.ej. `CotizarTarifaDTO`) es a la vez el esquema Zod
// (valor) y el tipo inferido — mismo patrón que usa `packages/shared` internamente.
// =============================================================================

import {
  CancelarSolicitudDTO,
  CotizacionRespuesta,
  CotizarTarifaDTO,
  CrearSolicitudDTO,
  EstadoSolicitudViaje,
  SolicitudCancelada,
  SolicitudCreada,
} from '@voyya/shared';
import { apiRequest } from './http-client';

export function cotizarTarifa(dto: CotizarTarifaDTO): Promise<CotizacionRespuesta> {
  const body = CotizarTarifaDTO.parse(dto);
  return apiRequest({ method: 'POST', path: '/trips/cotizar', body }, CotizacionRespuesta);
}

export function crearSolicitud(dto: CrearSolicitudDTO): Promise<SolicitudCreada> {
  const body = CrearSolicitudDTO.parse(dto);
  return apiRequest({ method: 'POST', path: '/trips', body }, SolicitudCreada);
}

export function obtenerEstadoSolicitud(idSolicitud: number): Promise<EstadoSolicitudViaje> {
  return apiRequest({ method: 'GET', path: `/trips/${idSolicitud}` }, EstadoSolicitudViaje);
}

export function cancelarSolicitud(
  idSolicitud: number,
  dto: CancelarSolicitudDTO = {},
): Promise<SolicitudCancelada> {
  const body = CancelarSolicitudDTO.parse(dto);
  return apiRequest({ method: 'POST', path: `/trips/${idSolicitud}/cancelar`, body }, SolicitudCancelada);
}
