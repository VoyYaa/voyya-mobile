import { useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import type { OfflineBannerState } from '@voyyaa/ui-mobile';
import { useNetworkStatus } from './useNetworkStatus';

const RESTORED_AUTOHIDE_MS = 2500;

export const CONNECTIVITY_RETRY_INTERVAL_SEC = 15;

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
