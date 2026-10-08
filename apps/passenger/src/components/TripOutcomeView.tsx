import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, MarkGlyph, PriceTag, ScreenHeader, StatePanel, useTheme } from '@voyyaa/ui-mobile';
import { passengerCopy } from '../copy/passenger-copy';

export type TripOutcomeKind = 'completed' | 'no_show' | 'cancelled_by_driver' | 'cancelled_by_you';

export interface TripOutcomeViewProps {
  kind: TripOutcomeKind;
  total: number;
  onHome: () => void;
}

const copy = passengerCopy.trip;

export function TripOutcomeView({ kind, total, onHome }: TripOutcomeViewProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title={copy.header} />
      <View style={{ flex: 1, justifyContent: 'center', padding: theme.spacing.lg }}>
        {kind === 'completed' && (
          <View
            testID="trip-completed"
            style={{ alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.xl }}
          >
            <MarkGlyph glyph="success" size={96} animate />
            <Text
              accessibilityRole="header"
              style={{
                ...theme.typography.headline,
                color: theme.colors.text,
                textAlign: 'center',
              }}
            >
              {copy.completedTitle}
            </Text>
            <PriceTag amountCOP={total} size="xl" />
            <Text
              style={{
                ...theme.typography.body,
                color: theme.colors.textMuted,
                textAlign: 'center',
              }}
            >
              {copy.completedBody}
            </Text>
            <View style={{ alignSelf: 'stretch', marginTop: theme.spacing.md }}>
              <Button
                label={copy.completedAction}
                size="lg"
                onPress={onHome}
                testID="trip-home-button"
              />
            </View>
          </View>
        )}
        {kind === 'no_show' && (
          <StatePanel
            glyph="error"
            title={copy.noShowTitle}
            body={copy.noShowBody}
            primaryAction={{ label: copy.noShowAction, onPress: onHome }}
            testID="trip-no-show"
          />
        )}
        {kind === 'cancelled_by_driver' && (
          <StatePanel
            glyph="empty"
            title={copy.cancelledByDriverTitle}
            body={copy.cancelledByDriverBody}
            primaryAction={{ label: copy.cancelledByDriverAction, onPress: onHome }}
            testID="trip-cancelled-driver"
          />
        )}
        {kind === 'cancelled_by_you' && (
          <StatePanel
            glyph="empty"
            title={copy.cancelledByYouTitle}
            body={copy.cancelledByYouBody}
            primaryAction={{ label: copy.cancelledByYouAction, onPress: onHome }}
            testID="trip-cancelled-self"
          />
        )}
      </View>
    </SafeAreaView>
  );
}
