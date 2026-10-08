import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Card, LinkButton, useTheme } from '@voyyaa/ui-mobile';
import { driverCopy } from '../copy/driver-copy';

export interface AssignmentRulesCardProps {
  radiusKm: number;
  timeoutSec: number;
}

export function AssignmentRulesCard({
  radiusKm,
  timeoutSec,
}: AssignmentRulesCardProps): React.JSX.Element {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <LinkButton
        label={driverCopy.home.rulesTrigger}
        tone="muted"
        onPress={() => setExpanded((current) => !current)}
        testID="rules-trigger"
      />
      {expanded && (
        <Card tone="tint" testID="rules-card">
          <Text style={{ ...theme.typography.smallStrong, color: theme.colors.text }}>
            {driverCopy.home.rulesTitle}
          </Text>
          <Text
            style={{
              ...theme.typography.small,
              color: theme.colors.textMuted,
              marginTop: theme.spacing.xxs,
            }}
          >
            {driverCopy.home.rulesBody(radiusKm, timeoutSec)}
          </Text>
        </Card>
      )}
    </View>
  );
}
