import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, LinkButton, PointRow, ScreenHeader, useTheme } from '@voyyaa/ui-mobile';
import { passengerCopy } from '../copy/passenger-copy';
import type { SavedTripMode } from '../lib/saved-trip-mode';
import { startCodeCardView } from '../lib/start-code-view';
import { InlineNotice } from './InlineNotice';
import { StartCodeCard } from './StartCodeCard';

export interface SavedTripViewProps {
  mode: SavedTripMode;
  code: string;
  savedAt: number;
  pickupAddress: string | null;
  retrying: boolean;
  onRetry: () => void;
  testID?: string;
}

const tripCopy = passengerCopy.trip;
const savedCopy = passengerCopy.savedTrip;

function ignorePress(): void {
  return undefined;
}

export function SavedTripView({
  mode,
  code,
  savedAt,
  pickupAddress,
  retrying,
  onRetry,
  testID = 'saved-trip-view',
}: SavedTripViewProps): React.JSX.Element {
  const theme = useTheme();
  const cancelReason =
    mode === 'offline' ? tripCopy.cancelOfflineHint : savedCopy.cancelReason.unconfirmed;
  const view = startCodeCardView({
    response: null,
    saved: code,
    offline: mode === 'offline',
    refreshFailed: mode === 'error',
    savedAt,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} testID={testID}>
      <ScreenHeader title={tripCopy.header} />
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
          gap: theme.spacing.md,
        }}
      >
        <StartCodeCard view={view} plate={null} arrived={false} changed={false} onRetry={onRetry} />

        <InlineNotice
          tone="info"
          glyph="clock"
          alert
          title={savedCopy.notice.title}
          body={savedCopy.notice.body[mode]}
          testID="saved-trip-notice"
        />

        <Button
          label={passengerCopy.startCode.retry}
          variant="ghost"
          size="md"
          onPress={onRetry}
          loading={mode === 'checking' || retrying}
          loadingLabel={savedCopy.retrying}
          testID="saved-trip-retry"
        />

        {pickupAddress !== null && (
          <Card tone="surface" testID="saved-trip-pickup">
            <PointRow kind="origin" label={tripCopy.pickupLabel} value={pickupAddress} />
          </Card>
        )}

        <View style={{ alignItems: 'center' }}>
          <LinkButton
            label={tripCopy.cancelTrip}
            tone="danger"
            disabled
            onPress={ignorePress}
            accessibilityHint={cancelReason}
            style={{ alignSelf: 'center' }}
            testID="cancel-trip-link"
          />
          <Text
            accessibilityElementsHidden
            importantForAccessibility="no"
            testID="saved-trip-cancel-reason"
            style={{
              ...theme.typography.small,
              color: theme.colors.textMuted,
              textAlign: 'center',
            }}
          >
            {cancelReason}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
