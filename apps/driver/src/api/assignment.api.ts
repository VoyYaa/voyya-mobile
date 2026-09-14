import { z } from 'zod';
import {
  AcceptAssignmentDTO,
  AcceptAssignmentResult,
  AssignmentError,
  AssignmentNotification,
  RejectAssignmentDTO,
} from '@voyyaa/shared';
import { apiRequest, buildAuthHeader, getApiBaseUrl, ApiError } from '@voyyaa/app-runtime';
import { ACTION_RESPONSE_TIMEOUT_MS } from '../constants/parameters';

export async function acceptAssignment(
  assignmentId: number,
  dto: AcceptAssignmentDTO = {},
): Promise<AcceptAssignmentResult> {
  const body = AcceptAssignmentDTO.parse(dto);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ACTION_RESPONSE_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/assignments/${assignmentId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...buildAuthHeader() },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    throw new ApiError(
      'network',
      aborted ? 'El servidor no respondió a tiempo.' : 'No hay conexión con el servidor.',
    );
  } finally {
    clearTimeout(timer);
  }

  const json: unknown = await res.json().catch(() => null);

  if (res.status === 200 || res.status === 409 || res.status === 410) {
    const parsed = AcceptAssignmentResult.safeParse(json);
    if (parsed.success) return parsed.data;
    throw new ApiError('validation', 'La respuesta del servidor no tiene el formato esperado.');
  }

  const parsedError = AssignmentError.safeParse(json);
  if (parsedError.success) {
    throw new ApiError('http', parsedError.data.message, res.status, parsedError.data.code);
  }
  throw new ApiError('http', `Error inesperado del servidor (${res.status}).`, res.status);
}

const RejectOk = z.object({ ok: z.literal(true) });

export function rejectAssignment(
  assignmentId: number,
  dto: RejectAssignmentDTO = {},
): Promise<z.infer<typeof RejectOk>> {
  const body = RejectAssignmentDTO.parse(dto);
  return apiRequest(
    { method: 'POST', path: `/assignments/${assignmentId}/reject`, body },
    RejectOk,
  );
}

export function listNearbyOffers(): Promise<AssignmentNotification[]> {
  return apiRequest(
    { method: 'GET', path: '/assignments/nearby' },
    z.array(AssignmentNotification),
  );
}
