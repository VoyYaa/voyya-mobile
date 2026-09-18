import React from 'react';
import { TextField } from '@voyyaa/ui-mobile';

export const LOCATION_REFERENCE_MAX_LENGTH = 60;

export interface LocationReferenceFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  accessibilityLabel: string;
}

export function LocationReferenceField({
  label,
  value,
  onChangeText,
  accessibilityLabel,
}: LocationReferenceFieldProps): React.JSX.Element {
  return (
    <TextField
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder="Ej. portería del edificio azul"
      maxLength={LOCATION_REFERENCE_MAX_LENGTH}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
