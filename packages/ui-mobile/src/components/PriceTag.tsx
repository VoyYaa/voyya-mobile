import React from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useTheme } from '../theme';
import { formatCOP } from '../utils/format';

export type PriceTagSize = 'sm' | 'md' | 'lg' | 'xl';

export interface PriceTagProps {
  amountCOP: number;
  size?: PriceTagSize;
  quiet?: boolean;
  color?: string;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

const SIZE_FONT: Record<PriceTagSize, number> = { sm: 15, md: 20, lg: 32, xl: 40 };
const CURRENCY_SCALE = 0.6;

export function PriceTag({
  amountCOP,
  size = 'md',
  quiet = false,
  color,
  style,
  accessibilityLabel,
  testID,
}: PriceTagProps): React.JSX.Element {
  const theme = useTheme();
  const text = formatCOP(amountCOP);
  const fontSize = SIZE_FONT[size];
  const symbolIndex = text.indexOf('$');
  const prefix = text.slice(0, symbolIndex);
  const digits = text.slice(symbolIndex + 1);
  const weightStyle = quiet ? theme.typography.bodyStrong : theme.typography.numeric;

  return (
    <Text
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? `${prefix}${digits} pesos`}
      style={[
        weightStyle,
        {
          fontVariant: ['tabular-nums'],
          fontSize,
          lineHeight: Math.round(fontSize * 1.1),
          color: color ?? (quiet ? theme.colors.textMuted : theme.colors.text),
        },
        style,
      ]}
    >
      {prefix}
      <Text style={{ fontSize: Math.round(fontSize * CURRENCY_SCALE) }}>$</Text>
      {digits}
    </Text>
  );
}
