import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Modal,
  SafeAreaView,
  Text,
  View,
  findNodeHandle,
  useWindowDimensions,
} from 'react-native';
import { mapCopy } from '../copy';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../theme';
import { MapControlButton } from './MapControlButton';

export interface MapExpandedModalProps {
  visible: boolean;
  title: string;
  summary: React.ReactNode;
  onClose: () => void;
  renderMap: (height: number) => React.ReactNode;
  testID?: string;
}

const HEADER_RESERVE_DP = 72;
const SUMMARY_MIN_DP = 120;

export function MapExpandedModal({
  visible,
  title,
  summary,
  onClose,
  renderMap,
  testID,
}: MapExpandedModalProps): React.JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const { height: windowHeight } = useWindowDimensions();
  const titleRef = useRef<Text>(null);
  const mapHeight = Math.max(240, windowHeight - HEADER_RESERVE_DP - SUMMARY_MIN_DP);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      const handle = titleRef.current ? findNodeHandle(titleRef.current) : null;
      if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
    }, 350);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType={reduced ? 'fade' : 'slide'}
      onRequestClose={onClose}
      testID={testID}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <View accessibilityViewIsModal style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: theme.spacing.gutter,
              paddingVertical: theme.spacing.sm,
            }}
          >
            <Text
              ref={titleRef}
              accessible
              accessibilityRole="header"
              style={{ ...theme.typography.title, color: theme.colors.text }}
            >
              {title}
            </Text>
            <MapControlButton
              icon="close"
              label={mapCopy.closeMap}
              onPress={onClose}
              testID="map-expanded-close"
            />
          </View>
          <View style={{ paddingHorizontal: theme.spacing.gutter }}>{renderMap(mapHeight)}</View>
          <View style={{ padding: theme.spacing.gutter, gap: theme.spacing.xs }}>{summary}</View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
