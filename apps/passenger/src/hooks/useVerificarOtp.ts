// =============================================================================
// VoyYa Pasajero — useVerificarOtp
// -----------------------------------------------------------------------------
// POST /auth/otp/verificar. MUTACIÓN — dispara una sola vez al completar el 4º
// dígito (OtpInput.onComplete), nunca por un botón aparte (HU-AUTH-01).
// =============================================================================

import { useMutation } from '@tanstack/react-query';
import type { VerificarOtpDTO } from '@voyya/shared';
import { verificarOtp } from '../api/auth.api';

export function useVerificarOtp() {
  return useMutation({
    mutationFn: (dto: VerificarOtpDTO) => verificarOtp(dto),
    retry: false,
  });
}
