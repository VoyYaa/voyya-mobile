// =============================================================================
// VoyYa Pasajero — useSolicitarOtp
// -----------------------------------------------------------------------------
// POST /auth/otp/solicitar. MUTACIÓN (la persona decide cuándo pedir/reenviar
// el código) — la usan tanto app/(auth)/telefono.tsx como el reenvío de
// app/(auth)/otp.tsx (mismo endpoint, HU-AUTH-01).
// =============================================================================

import { useMutation } from '@tanstack/react-query';
import type { SolicitarOtpDTO } from '@voyya/shared';
import { solicitarOtp } from '../api/auth.api';

export function useSolicitarOtp() {
  return useMutation({
    mutationFn: (dto: SolicitarOtpDTO) => solicitarOtp(dto),
    retry: false,
  });
}
