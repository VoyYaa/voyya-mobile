// =============================================================================
// VoyYa Conductor — useNetworkStatus
// -----------------------------------------------------------------------------
// Mismo patrón que apps/passenger/src/hooks/useNetworkStatus.ts. Conectividad
// real del dispositivo (NetInfo) — base del OfflineBanner y de deshabilitar
// acciones que comprometen algo (Aceptar/Rechazar nunca optimistas).
// =============================================================================

import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export type NetworkStatus = 'online' | 'offline';

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>('online');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = Boolean(state.isConnected) && state.isInternetReachable !== false;
      setStatus(isOnline ? 'online' : 'offline');
    });
    return unsubscribe;
  }, []);

  return status;
}
