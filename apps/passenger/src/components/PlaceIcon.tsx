import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { useTheme } from '@voyyaa/ui-mobile';
import type { PoiYarumalCategory } from '../constants/pois-yarumal';

export interface PlaceIconProps {
  category: PoiYarumalCategory;
  size?: number;
}

const DEFAULT_SIZE = 44;
const GLYPH_RATIO = 0.55;

function CategoryGlyph({
  category,
  ink,
}: {
  category: PoiYarumalCategory;
  ink: string;
}): React.JSX.Element {
  const stroke = {
    stroke: ink,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;

  switch (category) {
    case 'plaza':
      return (
        <>
          <Circle cx={12} cy={9} r={5} fill="none" {...stroke} />
          <Line x1={12} y1={14} x2={12} y2={20} {...stroke} />
          <Line x1={8} y1={20} x2={16} y2={20} {...stroke} />
        </>
      );
    case 'salud':
      return (
        <>
          <Rect x={4} y={4} width={16} height={16} rx={4} fill="none" {...stroke} />
          <Line x1={12} y1={8} x2={12} y2={16} {...stroke} />
          <Line x1={8} y1={12} x2={16} y2={12} {...stroke} />
        </>
      );
    case 'gobierno':
      return (
        <>
          <Path d="M4 10 L12 4 L20 10 Z" fill="none" {...stroke} />
          <Line x1={7} y1={12} x2={7} y2={18} {...stroke} />
          <Line x1={12} y1={12} x2={12} y2={18} {...stroke} />
          <Line x1={17} y1={12} x2={17} y2={18} {...stroke} />
          <Line x1={4} y1={20} x2={20} y2={20} {...stroke} />
        </>
      );
    case 'transporte':
      return (
        <>
          <Rect x={5} y={4} width={14} height={13} rx={3} fill="none" {...stroke} />
          <Line x1={5} y1={11} x2={19} y2={11} {...stroke} />
          <Circle cx={9} cy={20} r={1.2} fill={ink} />
          <Circle cx={15} cy={20} r={1.2} fill={ink} />
        </>
      );
  }
}

export function PlaceIcon({ category, size = DEFAULT_SIZE }: PlaceIconProps): React.JSX.Element {
  const theme = useTheme();
  const glyphSize = Math.round(size * GLYPH_RATIO);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.brandTint,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={glyphSize} height={glyphSize} viewBox="0 0 24 24">
        <CategoryGlyph category={category} ink={theme.colors.brandInk} />
      </Svg>
    </View>
  );
}
