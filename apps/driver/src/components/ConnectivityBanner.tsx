// =============================================================================
// VoyYa Conductor — ConnectivityBanner
// -----------------------------------------------------------------------------
// Mismo patrón que apps/passenger/src/components/ConnectivityBanner.tsx.
// Montado una sola vez en app/_layout.tsx (Home/Solicitudes/Detalle comparten
// el mismo banner — §2.4.4 de conductor-solicitud-asignacion.md).
// =============================================================================

import React from 'react';
import { OfflineBanner } from '@voyya/ui-mobile';
import { useConnectivityBanner } from '../hooks/useConnectivityBanner';

export function ConnectivityBanner(): React.JSX.Element | null {
  const banner = useConnectivityBanner();
  if (!banner.visible) return null;
  return (
    <OfflineBanner
      state={banner.state}
      onRetryNow={banner.state === 'offline' ? banner.retryNow : undefined}
    />
  );
}
