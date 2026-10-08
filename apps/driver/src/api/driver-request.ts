import { z } from 'zod';
import { AssignmentError } from '@voyyaa/shared';
import { apiRequest, type ApiErrorPayload } from '@voyyaa/app-runtime';
import { PIN_CHANGE_REQUIRED_CODE, isPinChangeRequiredError } from '../auth/pin-errors';
import { usePinGateStore } from '../auth/usePinGateStore';

const PinChangeRequiredPayload = z.object({
  code: z.literal(PIN_CHANGE_REQUIRED_CODE),
  message: z.string(),
});

export function withPinChangeRequired(
  errorSchema: z.ZodType<ApiErrorPayload>,
): z.ZodType<ApiErrorPayload> {
  return z.union([errorSchema, PinChangeRequiredPayload]);
}

export function reportPinChangeRequired(error: unknown): void {
  if (isPinChangeRequiredError(error)) usePinGateStore.getState().setForced(true);
}

export async function driverRequest<TResponse>(
  options: Parameters<typeof apiRequest>[0],
  responseSchema: z.ZodType<TResponse, z.ZodTypeDef, unknown>,
  errorSchema: z.ZodType<ApiErrorPayload> = AssignmentError,
): Promise<TResponse> {
  try {
    return await apiRequest(options, responseSchema, withPinChangeRequired(errorSchema));
  } catch (error) {
    reportPinChangeRequired(error);
    throw error;
  }
}
