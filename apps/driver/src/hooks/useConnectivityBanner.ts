// =============================================================================
// VoyYa Conductor — useConnectivityBanner
// -----------------------------------------------------------------------------
// Mismo patrón que apps/passenger/src/hooks/useConnectivityBanner.ts. Traduce
// online/offline al ciclo de 3 estados de <OfflineBanner> y expone si debe
// montarse (nunca se muestra si la app jamás estuvo offline). Comportamiento
// separado de la presentación (SRP).
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
      void NetInfo.fetch();
    },
  };
}

export { RETRY_INTERVALO_CONEXION_SEG };
