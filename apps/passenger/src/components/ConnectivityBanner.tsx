// =============================================================================
// VoyYa Pasajero — ConnectivityBanner
// -----------------------------------------------------------------------------
// Conecta el comportamiento (useConnectivityBanner) con la presentación
// (<OfflineBanner> de @voyya/ui-mobile). Montado una sola vez en app/_layout.tsx
// para que Home/Buscando/Conductor-asignado compartan el mismo banner
// (pasajero-estados-borde.md §6.1).
// =============================================================================

import React from 'react';
import { OfflineBanner } from '@voyya/ui-mobile';
import { useConnectivityBanner } from '../hooks/useConnectivityBanner';

export function ConnectivityBanner(): React.JSX.Element | null {
  const banner = useConnectivityBanner();
  if (!banner.visible) return null;
  return <OfflineBanner state={banner.state} onRetryNow={banner.state === 'offline' ? banner.retryNow : undefined} />;
}
