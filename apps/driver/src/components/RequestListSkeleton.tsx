import React from 'react';
import { View } from 'react-native';
import { Card, Skeleton, useTheme } from '@voyyaa/ui-mobile';

function GhostRow(): React.JSX.Element {
  const theme = useTheme();
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <Skeleton width={44} height={44} radius={22} />
        <View style={{ flex: 1, gap: theme.spacing.xs as number }}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="85%" height={13} />
        </View>
        <Skeleton width={56} height={20} />
      </View>
    </Card>
  );
}

export interface RequestListSkeletonProps {
  count?: number;
}

export function RequestListSkeleton({ count = 3 }: RequestListSkeletonProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ gap: theme.spacing.sm as number }}
    >
      {Array.from({ length: count }, (_, i) => (
        <GhostRow key={i} />
      ))}
    </View>
  );
}
