import React from 'react';
import { OfflineBanner } from '@voyyaa/ui-mobile';
import { useConnectivityBanner } from './useConnectivityBanner';

export interface ConnectivityBannerProps {
  topInset?: number;
}

export function ConnectivityBanner({
  topInset,
}: ConnectivityBannerProps = {}): React.JSX.Element | null {
  const banner = useConnectivityBanner();
  if (!banner.visible) return null;
  return (
    <OfflineBanner
      state={banner.state}
      topInset={topInset}
      onRetryNow={banner.state === 'offline' ? banner.retryNow : undefined}
    />
  );
}
