import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme';
import { uiCopy } from '../copy';
import { useFocusState } from '../hooks/useFocusState';

export type ScreenHeaderVariant = 'bar' | 'large';
export type ScreenHeaderTone = 'default' | 'stage';

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  variant?: ScreenHeaderVariant;
  tone?: ScreenHeaderTone;
  hideTitle?: boolean;
  scrolled?: boolean;
  testID?: string;
}

const HEADER_MIN_HEIGHT = 56;

interface BackButtonProps {
  onBack: () => void;
  background: string;
  ink: string;
}

function BackButton({ onBack, background, ink }: BackButtonProps): React.JSX.Element {
  const theme = useTheme();
  const { focused, onFocus, onBlur } = useFocusState();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={uiCopy.back}
      onPress={onBack}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        width: theme.touch.min,
        height: theme.touch.min,
        borderRadius: theme.touch.min / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: background,
        borderWidth: 2,
        borderColor: focused ? theme.colors.focusRing : 'transparent',
      }}
    >
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Path
          d="M14.5 5.5 L8 12 L14.5 18.5"
          stroke={ink}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Pressable>
  );
}

export function ScreenHeader({
  title,
  onBack,
  right,
  variant = 'bar',
  tone = 'default',
  hideTitle = false,
  scrolled = false,
  testID,
}: ScreenHeaderProps): React.JSX.Element {
  const theme = useTheme();
  const { colors } = theme;
  const onStage = tone === 'stage';
  const ink = onStage ? colors.onStage : colors.text;
  const backgroundColor = onStage ? colors.stageRaised : colors.surfaceSunken;
  const hasTitle = title.trim().length > 0;
  const isLarge = variant === 'large';

  const titleNode = hasTitle ? (
    <Text
      accessibilityRole="header"
      numberOfLines={1}
      style={
        hideTitle
          ? { position: 'absolute', width: 1, height: 1, opacity: 0 }
          : {
              ...(isLarge ? theme.typography.headline : theme.typography.subtitle),
              color: ink,
              flex: 1,
              textAlign: isLarge ? 'left' : 'center',
            }
      }
    >
      {title}
    </Text>
  ) : null;

  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingHorizontal: isLarge ? theme.spacing.gutter : theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        minHeight: HEADER_MIN_HEIGHT,
        borderBottomWidth: scrolled ? 1 : 0,
        borderBottomColor: onStage ? colors.stageLine : colors.border,
      }}
    >
      {!isLarge && (
        <View style={{ width: theme.touch.min }}>
          {onBack !== undefined && (
            <BackButton onBack={onBack} background={backgroundColor} ink={ink} />
          )}
        </View>
      )}
      {isLarge && onBack !== undefined && (
        <BackButton onBack={onBack} background={backgroundColor} ink={ink} />
      )}
      {hideTitle || !hasTitle ? <View style={{ flex: 1 }}>{titleNode}</View> : titleNode}
      <View style={{ minWidth: isLarge ? undefined : theme.touch.min, alignItems: 'flex-end' }}>
        {right}
      </View>
    </View>
  );
}
