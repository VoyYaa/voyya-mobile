import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { LinkButton, useTheme } from '@voyyaa/ui-mobile';
import { placeCopy } from '../copy/place-copy';
import { referenceView } from '../lib/address-presentation';
import { LocationReferenceField } from './LocationReferenceField';

export interface PointReferenceProps {
  value: string;
  onChange: (value: string) => void;
  fieldLabel: string;
  accessibilityLabel: string;
  testID: string;
}

export function PointReference({
  value,
  onChange,
  fieldLabel,
  accessibilityLabel,
  testID,
}: PointReferenceProps): React.JSX.Element {
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const view = referenceView(value, editing);

  if (view === 'edit') {
    return (
      <View style={{ gap: theme.spacing.xs, paddingTop: theme.spacing.xs }}>
        <LocationReferenceField
          label={fieldLabel}
          value={value}
          onChangeText={onChange}
          accessibilityLabel={accessibilityLabel}
        />
        <LinkButton
          label={placeCopy.doneReference}
          onPress={() => setEditing(false)}
          testID={`${testID}-done`}
        />
      </View>
    );
  }

  if (view === 'show') {
    return (
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}
        testID={testID}
      >
        <Text
          numberOfLines={2}
          style={{ ...theme.typography.small, color: theme.colors.textMuted, flex: 1 }}
        >
          {placeCopy.reference(value.trim())}
        </Text>
        <LinkButton
          label={placeCopy.editReference}
          onPress={() => setEditing(true)}
          testID={`${testID}-edit`}
        />
      </View>
    );
  }

  return (
    <LinkButton
      label={placeCopy.addReference}
      onPress={() => setEditing(true)}
      testID={`${testID}-add`}
    />
  );
}
