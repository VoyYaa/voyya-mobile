import React from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Reveal, StatusBanner, type StatusBannerTone } from '@voyyaa/ui-mobile';
import { notificationsCopy } from '../copy/notifications-copy';
import {
  bannerPresentation,
  type NotificationsBannerVariant,
} from '../lib/notifications-banner';

export interface NotificationsBannerProps {
  variant: NotificationsBannerVariant;
  onAction?: () => void;
  onDismiss?: () => void;
  onHeightChange?: (height: number) => void;
  testID?: string;
}

const TONE_BY_VARIANT: Record<NotificationsBannerVariant, StatusBannerTone> = {
  askable: 'info',
  blocked: 'warning',
  failed: 'warning',
  offline: 'info',
  unsupported: 'info',
  activating: 'info',
  confirmed: 'info',
};

export function NotificationsBanner({
  variant,
  onAction,
  onDismiss,
  onHeightChange,
  testID = 'notifications-banner',
}: NotificationsBannerProps): React.JSX.Element {
  const view = bannerPresentation(variant);

  const handleLayout = (event: LayoutChangeEvent): void => {
    onHeightChange?.(event.nativeEvent.layout.height);
  };

  return (
    <View onLayout={handleLayout} style={{ alignSelf: 'stretch' }}>
      <Reveal>
        <StatusBanner
          tone={TONE_BY_VARIANT[variant]}
          icon={view.glyph}
          title={view.title}
          body={view.body ?? undefined}
          actionLabel={view.actionLabel ?? undefined}
          actionHint={view.actionHint ?? undefined}
          onAction={onAction}
          onDismiss={view.dismissible ? onDismiss : undefined}
          dismissLabel={notificationsCopy.banner.dismiss}
          role="status"
          testID={testID}
        />
      </Reveal>
    </View>
  );
}
