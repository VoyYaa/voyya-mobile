import React from 'react';
import { Text } from 'react-native';
import { Card, useTheme } from '@voyyaa/ui-mobile';

export interface AssignmentRulesCardProps {
  radioKm: number;
  timeoutSeg: number;
}

export function AssignmentRulesCard({
  radioKm,
  timeoutSeg,
}: AssignmentRulesCardProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <Card tone="alt">
      <Text style={{ ...theme.typography.small, fontWeight: '600', color: theme.colors.text }}>
        Reglas de asignación
      </Text>
      <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginTop: 2 }}>
        Mostradas por cercanía · radio {radioKm} km · timeout {timeoutSeg} s por conductor
      </Text>
    </Card>
  );
}
