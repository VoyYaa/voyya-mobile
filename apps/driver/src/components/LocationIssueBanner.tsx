import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinkButton, useTheme } from '@voyyaa/ui-mobile';
import {
  locationBannerView,
  type LocationBannerContext,
  type LocationBannerIcon,
  type LocationBannerKind,
  type LocationBannerTone,
} from '../home/location-banner-view';

export type { LocationBannerKind };

export interface LocationIssueBannerProps {
  kind: LocationBannerKind;
  context?: LocationBannerContext;
  onPress: () => void;
}

const ICON_SIZE = 24;

interface BannerGlyphProps {
  icon: LocationBannerIcon;
  color: string;
}

function BannerGlyph({ icon, color }: BannerGlyphProps): React.JSX.Element {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
        {icon === 'pin' && (
          <>
            <Path
              d="M12 21s-6.5-5.6-6.5-10.8A6.5 6.5 0 0 1 12 3.7a6.5 6.5 0 0 1 6.5 6.5C18.5 15.4 12 21 12 21Z"
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <Circle cx={12} cy={10.2} r={2.2} fill={color} />
          </>
        )}
        {icon === 'clock' && (
          <>
            <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={2} />
            <Path
              d="M12 7.5V12l3 2"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
        {icon === 'alert' && (
          <>
            <Path
              d="M12 3.8 21 19.5H3L12 3.8Z"
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <Path d="M12 10v4.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Circle cx={12} cy={17} r={1.1} fill={color} />
          </>
        )}
      </Svg>
    </View>
  );
}

export function LocationIssueBanner({
  kind,
  context = 'shift',
  onPress,
}: LocationIssueBannerProps): React.JSX.Element {
  const theme = useTheme();
  const view = locationBannerView(kind, context);
  const { colors } = theme;
  const toneColors: Record<LocationBannerTone, { background: string; ink: string }> = {
    info: { background: colors.infoTint, ink: colors.infoInk },
    warning: { background: colors.warningTint, ink: colors.warningInk },
    danger: { background: colors.dangerTint, ink: colors.dangerInk },
  };
  const tone = toneColors[view.tone];

  return (
    <View
      testID="location-issue-banner"
      accessibilityRole={view.urgent ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      style={{
        backgroundColor: tone.background,
        borderRadius: theme.radius.card,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.xs,
        gap: theme.spacing.xs,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md }}>
        <BannerGlyph icon={view.icon} color={tone.ink} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ ...theme.typography.bodyStrong, color: tone.ink }}>{view.title}</Text>
          <Text style={{ ...theme.typography.small, color: tone.ink }}>{view.body}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <LinkButton
          label={view.action}
          onPress={onPress}
          accessibilityLabel={`${view.title}. ${view.action}`}
          testID="location-issue-banner-action"
        />
      </View>
    </View>
  );
}
