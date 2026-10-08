import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card, LinkButton, MarkGlyph, useTheme } from '@voyyaa/ui-mobile';
import { passengerCopy } from '../copy/passenger-copy';

export interface NoOriginPanelProps {
  onPickPoint: () => void;
  onUseLocation: () => void;
}

const copy = passengerCopy.home;

export function NoOriginPanel({
  onPickPoint,
  onUseLocation,
}: NoOriginPanelProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <Card tone="surface" testID="home-no-origin" style={{ gap: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <MarkGlyph glyph="pin" size={48} animate={false} />
        <Text
          accessibilityRole="header"
          style={{ ...theme.typography.title, color: theme.colors.text, flex: 1 }}
        >
          {copy.noOriginTitle}
        </Text>
      </View>
      <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
        {copy.noOriginBody}
      </Text>
      <Button
        label={copy.pickPoint}
        size="lg"
        onPress={onPickPoint}
        testID="home-pick-point-button"
      />
      <View style={{ alignItems: 'center' }}>
        <LinkButton
          label={copy.useMyLocation}
          onPress={onUseLocation}
          style={{ alignSelf: 'center' }}
          testID="home-use-location-link"
        />
      </View>
    </Card>
  );
}
