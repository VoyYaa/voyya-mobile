// =============================================================================
// VoyYa Conductor — useLoginConductor
// -----------------------------------------------------------------------------
// POST /auth/conductor/login (HU-AUTH-02). MUTACIÓN simple — la pantalla
// decide todos los estados (verificando/credenciales/bloqueo/suspendido) según
// `codigoErrorDominio`/`reintentarEnSegDe` del error devuelto.
// =============================================================================

import { useMutation } from '@tanstack/react-query';
import type { LoginConductorDTO } from '@voyya/shared';
import { loginConductor } from '../api/auth.api';

export function useLoginConductor() {
  return useMutation({
    mutationFn: (dto: LoginConductorDTO) => loginConductor(dto),
    retry: false,
  });
}
