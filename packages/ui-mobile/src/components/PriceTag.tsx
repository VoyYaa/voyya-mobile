import React from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useTheme } from '../theme';
import { formatCOP } from '../utils/format';

export interface PriceTagProps {
  amountCOP: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

const SIZE_FONT: Record<NonNullable<PriceTagProps['size']>, number> = { sm: 15, md: 20, lg: 32 };

export function PriceTag({ amountCOP, size = 'md', color, style, accessibilityLabel }: PriceTagProps): React.JSX.Element {
  const theme = useTheme();
  const text = formatCOP(amountCOP);

  return (
    <Text
      accessibilityLabel={accessibilityLabel ?? `${text} pesos`}
      style={[theme.typography.numeric, { fontSize: SIZE_FONT[size], color: color ?? theme.colors.text }, style]}
    >
      {text}
    </Text>
  );
}
