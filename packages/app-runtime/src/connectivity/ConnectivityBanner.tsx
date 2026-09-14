import React from 'react';
import { OfflineBanner } from '@voyyaa/ui-mobile';
import { useConnectivityBanner } from './useConnectivityBanner';

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
