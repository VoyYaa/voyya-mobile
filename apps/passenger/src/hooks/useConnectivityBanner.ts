// =============================================================================
// VoyYa Pasajero — useConnectivityBanner
// -----------------------------------------------------------------------------
// Traduce `useNetworkStatus` (online/offline) al ciclo de 3 estados que pinta
// <OfflineBanner> (offline → restored autooculto) y expone si debe montarse
// (nunca se muestra si la app jamás estuvo offline — pasajero-estados-borde.md §6.3).
// Comportamiento (no presentación) separado del componente — SRP.
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import type { OfflineBannerState } from '@voyya/ui-mobile';
import { useNetworkStatus } from './useNetworkStatus';
import { RETRY_INTERVALO_CONEXION_SEG } from '../constants/parametros';

const RESTORED_AUTOHIDE_MS = 2500;

export interface ConnectivityBanner {
  visible: boolean;
  state: OfflineBannerState;
  isOffline: boolean;
  retryNow: () => void;
}

export function useConnectivityBanner(): ConnectivityBanner {
  const status = useNetworkStatus();
  const [bannerState, setBannerState] = useState<OfflineBannerState | null>(null);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (status === 'offline') {
      wasOffline.current = true;
      setBannerState('offline');
      return;
    }
    // status === 'online'
    if (wasOffline.current) {
      setBannerState('restored');
      const timer = setTimeout(() => setBannerState(null), RESTORED_AUTOHIDE_MS);
      wasOffline.current = false;
      return () => clearTimeout(timer);
    }
  }, [status]);

  return {
    visible: bannerState !== null,
    state: bannerState ?? 'restored',
    isOffline: status === 'offline',
    retryNow: () => {
      // El listener de `useNetworkStatus` ya reintenta solo cada
      // RETRY_INTERVALO_CONEXION_SEG; este botón solo adelanta esa comprobación.
      void NetInfo.fetch();
    },
  };
}

// Reexportado para que quien arme el banner en pantalla use el mismo intervalo
// declarado (sin hardcodearlo dos veces).
export { RETRY_INTERVALO_CONEXION_SEG };
