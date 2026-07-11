// =============================================================================
// VoyYa Pasajero — useNetworkStatus
// -----------------------------------------------------------------------------
// Conectividad real del dispositivo (NetInfo). Base para el banner "sin
// conexión" y para deshabilitar acciones que comprometen algo (§6.4 de
// pasajero-estados-borde.md: Solicitar/Reintentar/Cancelar nunca optimistas).
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
