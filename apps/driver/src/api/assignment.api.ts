// =============================================================================
// VoyYa Conductor — API del dominio ASSIGNMENT
// -----------------------------------------------------------------------------
// Funciones finas 1:1 con el contrato de `@voyya/shared/contracts/assignment`.
// Ningún tipo se redefine: se importan los DTOs/esquemas Zod tal cual (mismo
// patrón que apps/passenger/src/api/trips.api.ts).
// =============================================================================

import { z } from 'zod';
import {
  AceptarAsignacionDTO,
  ErrorAssignment,
  NotificacionAsignacion,
  RechazarAsignacionDTO,
  ResultadoAceptacion,
} from '@voyya/shared';
import { apiRequest, buildAuthHeader, resolveBaseUrl } from './http-client';
import { ApiError } from './errors';
import { TIMEOUT_RESPUESTA_ACCION_MS } from '../constants/parametros';

// -----------------------------------------------------------------------------
// ACEPTAR — POST /assignments/:id/aceptar (HU-07/HU-08, toma única atómica)
// -----------------------------------------------------------------------------
// CASO ESPECIAL (no se puede reusar `apiRequest` genérico): el controlador del
// backend (apps/api/src/modules/assignment/assignment.controller.ts) devuelve
// el MISMO cuerpo `ResultadoAceptacion` (discriminated union) tanto en 200 como
// en 409 ('ya_tomada') y 410 ('expirada') — ver `assignment.service.ts`:
//   res.status(r.resultado === 'aceptada' ? 200 : r.resultado === 'ya_tomada' ? 409 : 410)
// Es decir: 409/410 NO son errores HTTP genéricos, son resultados de negocio
// válidos que la UI debe distinguir con estados propios (contexto clave de esta
// tarea). Solo 403 (NO_ES_EL_CONDUCTOR) / 404 (ASIGNACION_NO_EXISTE) / 5xx son
// errores reales. Añade además el timeout de cliente de 8 s de §3.4.2 (nunca
// "girando" indefinidamente si el servidor no responde).
export async function aceptarAsignacion(
  idAsignacion: number,
  dto: AceptarAsignacionDTO = {},
): Promise<ResultadoAceptacion> {
  const body = AceptarAsignacionDTO.parse(dto);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_RESPUESTA_ACCION_MS);

  let res: Response;
  try {
    res = await fetch(`${resolveBaseUrl()}/assignments/${idAsignacion}/aceptar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...buildAuthHeader() },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    const abortado = e instanceof Error && e.name === 'AbortError';
    throw new ApiError(
      'network',
      abortado ? 'El servidor no respondió a tiempo.' : 'No hay conexión con el servidor.',
    );
  } finally {
    clearTimeout(timer);
  }

  const json: unknown = await res.json().catch(() => null);

  // 200/409/410: los TRES traen un `ResultadoAceptacion` válido en el cuerpo.
  if (res.status === 200 || res.status === 409 || res.status === 410) {
    const parsed = ResultadoAceptacion.safeParse(json);
    if (parsed.success) return parsed.data;
    throw new ApiError('validation', 'La respuesta del servidor no tiene el formato esperado.');
  }

  // Resto (403/404/5xx): error de dominio real, no un resultado de negocio.
  const parsedError = ErrorAssignment.safeParse(json);
  if (parsedError.success) {
    throw new ApiError('http', parsedError.data.mensaje, res.status, parsedError.data.codigo);
  }
  throw new ApiError('http', `Error inesperado del servidor (${res.status}).`, res.status);
}

// -----------------------------------------------------------------------------
// RECHAZAR — POST /assignments/:id/rechazar (HU-09, antes de aceptar)
// -----------------------------------------------------------------------------
// 200 { ok: true } · 404 ASIGNACION_NO_EXISTE · 409 ESTADO_INVALIDO (ya no
// notificada). El backend no define un tipo compartido para `{ ok: true }` (no
// es un DTO de dominio en @voyya/shared, es la respuesta literal del controller);
// se valida aquí con un esquema local mínimo — mismo criterio que
// `GenericErrorShape` en http-client.ts (no es "redefinir" un tipo del contrato).
const RechazoOk = z.object({ ok: z.literal(true) });

export function rechazarAsignacion(
  idAsignacion: number,
  dto: RechazarAsignacionDTO = {},
): Promise<z.infer<typeof RechazoOk>> {
  const body = RechazarAsignacionDTO.parse(dto);
  return apiRequest(
    { method: 'POST', path: `/assignments/${idAsignacion}/rechazar`, body },
    RechazoOk,
  );
}

// -----------------------------------------------------------------------------
// LISTAR solicitudes cercanas (conductor en turno) — GAP DE CONTRATO, ver nota
// -----------------------------------------------------------------------------
// GAP conocido (reportar a `arquitectura`/`backend`, mismo criterio que la nota
// de useCoverageGate.ts en apps/passenger): a la fecha de este build,
// `apps/api/src/modules/assignment/assignment.controller.ts` SOLO expone
// `:id/aceptar|rechazar|cancelar` — no existe un endpoint `GET` que liste las
// asignaciones/candidatos notificados a un conductor. El motor actual
// (assignment.service.ts, nearest-first + retry chain) además notifica a UN
// conductor a la vez (no "broadcast" a varios candidatos simultáneos), lo cual
// tensiona con la pantalla "Lista de solicitudes cercanas" de la spec UX (que
// asume varias candidatas visibles a la vez) — esa reconciliación de producto
// es una decisión de `arquitectura`/`producto`, no de este build de frontend.
//
// Esta función asume la ruta REST más natural bajo el mismo recurso
// (`GET /assignments/cercanas`) y valida la respuesta con `z.array(NotificacionAsignacion)`
// — reusa el esquema exacto del contrato (sin redefinir campos). Cuando el
// endpoint real exista (aunque cambie de path), solo este archivo cambia: las
// pantallas y hooks ya consumen el tipo correcto.
export function listarSolicitudesCercanas(): Promise<NotificacionAsignacion[]> {
  return apiRequest(
    { method: 'GET', path: '/assignments/cercanas' },
    z.array(NotificacionAsignacion),
  );
}
