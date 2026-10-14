import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export type NetworkStatus = 'online' | 'offline';

let lastKnownStatus: NetworkStatus = 'online';

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(lastKnownStatus);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = Boolean(state.isConnected) && state.isInternetReachable !== false;
      lastKnownStatus = isOnline ? 'online' : 'offline';
      setStatus(lastKnownStatus);
    });
    return unsubscribe;
  }, []);

  return status;
}
