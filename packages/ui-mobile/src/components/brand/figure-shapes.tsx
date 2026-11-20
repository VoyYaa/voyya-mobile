import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { BRAND_COLORS } from '../../tokens';
import {
  BRAND_ICON_VIEWBOX,
  BRAND_TAXI_GRILLE,
  BRAND_TAXI_HEADLIGHTS,
  BRAND_TAXI_HEADLIGHT_CENTER_RADIUS,
  BRAND_TAXI_HEADLIGHT_RADIUS,
  BRAND_TAXI_ROOF_LIGHT,
  BRAND_TAXI_ROOF_LIGHT_PILL,
  BRAND_TAXI_WINDSHIELD_PATH,
  BRAND_TAXI_WINDSHIELD_STROKE,
  BRAND_WHEEL_CENTER,
  BRAND_WHEEL_HOLE_RADIUS,
  BRAND_WHEEL_HUB_CENTER_RADIUS,
  BRAND_WHEEL_HUB_RADIUS,
  BRAND_WHEEL_MARK,
  BRAND_WHEEL_SPOKES,
  type BrandFigure,
} from './brand-geometry';

export interface FigureColors {
  bodyColor: string;
  gapColor: string;
}

export function TaxiDetailsShapes({ gapColor }: { gapColor: string }): React.JSX.Element {
  return (
    <>
      <Path
        d={BRAND_TAXI_WINDSHIELD_PATH}
        fill={gapColor}
        stroke={gapColor}
        strokeWidth={BRAND_TAXI_WINDSHIELD_STROKE}
        strokeLinejoin="round"
      />
      {BRAND_TAXI_HEADLIGHTS.map((light) => (
        <G key={light.cx}>
          <Circle cx={light.cx} cy={light.cy} r={BRAND_TAXI_HEADLIGHT_RADIUS} fill={gapColor} />
          <Circle
            cx={light.cx}
            cy={light.cy}
            r={BRAND_TAXI_HEADLIGHT_CENTER_RADIUS}
            fill={BRAND_COLORS.crema}
          />
        </G>
      ))}
      <Rect {...BRAND_TAXI_GRILLE} fill={gapColor} />
    </>
  );
}

export function TaxiRoofLightShapes({ bodyColor, gapColor }: FigureColors): React.JSX.Element {
  const { stroke, ...pill } = BRAND_TAXI_ROOF_LIGHT_PILL;
  return (
    <>
      <Rect {...BRAND_TAXI_ROOF_LIGHT} fill={bodyColor} />
      <Rect {...pill} fill={BRAND_COLORS.go} stroke={gapColor} strokeWidth={stroke} />
    </>
  );
}

export function WheelDetailsShapes({ bodyColor, gapColor }: FigureColors): React.JSX.Element {
  return (
    <>
      <Circle
        cx={BRAND_WHEEL_CENTER.cx}
        cy={BRAND_WHEEL_CENTER.cy}
        r={BRAND_WHEEL_HOLE_RADIUS}
        fill={gapColor}
      />
      {BRAND_WHEEL_SPOKES.map((spoke) => (
        <Rect key={`${spoke.x}-${spoke.y}`} {...spoke} fill={bodyColor} />
      ))}
      <Circle
        cx={BRAND_WHEEL_CENTER.cx}
        cy={BRAND_WHEEL_CENTER.cy}
        r={BRAND_WHEEL_HUB_RADIUS}
        fill={bodyColor}
      />
      <Circle
        cx={BRAND_WHEEL_CENTER.cx}
        cy={BRAND_WHEEL_CENTER.cy}
        r={BRAND_WHEEL_HUB_CENTER_RADIUS}
        fill={BRAND_COLORS.crema}
      />
    </>
  );
}

export function WheelMarkShapes(): React.JSX.Element {
  return <Rect {...BRAND_WHEEL_MARK} fill={BRAND_COLORS.go} />;
}

function TaxiIconShapes({ bodyColor, gapColor }: FigureColors): React.JSX.Element {
  return (
    <>
      <Rect x={442} y={262} width={140} height={50} rx={16} fill={bodyColor} />
      <Rect
        x={458}
        y={272}
        width={108}
        height={30}
        rx={15}
        fill={BRAND_COLORS.go}
        stroke={gapColor}
        strokeWidth={6}
      />
      <Path
        d="M402,320 L622,320 L700,500 L324,500 Z"
        fill={bodyColor}
        stroke={bodyColor}
        strokeWidth={20}
        strokeLinejoin="round"
      />
      <Rect x={272} y={480} width={480} height={250} rx={80} fill={bodyColor} />
      <Path
        d="M432,342 L592,342 L652,470 L372,470 Z"
        fill={gapColor}
        stroke={gapColor}
        strokeWidth={12}
        strokeLinejoin="round"
      />
      <Circle cx={362} cy={596} r={38} fill={gapColor} />
      <Circle cx={362} cy={596} r={20} fill={BRAND_COLORS.crema} />
      <Circle cx={662} cy={596} r={38} fill={gapColor} />
      <Circle cx={662} cy={596} r={20} fill={BRAND_COLORS.crema} />
      <Rect x={432} y={570} width={160} height={52} rx={26} fill={gapColor} />
    </>
  );
}

function WheelIconShapes({ bodyColor }: FigureColors): React.JSX.Element {
  return (
    <>
      <Circle cx={512} cy={512} r={242} fill="none" stroke={bodyColor} strokeWidth={76} />
      <Path d="M280,512 H744 M512,512 V744" fill="none" stroke={bodyColor} strokeWidth={68} />
      <Circle cx={512} cy={512} r={100} fill={bodyColor} />
      <Circle cx={512} cy={512} r={36} fill={BRAND_COLORS.crema} />
      <Rect x={464} y={255} width={96} height={40} rx={20} fill={BRAND_COLORS.go} />
    </>
  );
}

export interface BrandFigureIconProps extends FigureColors {
  figure: BrandFigure;
  size: number;
}

export function BrandFigureIcon({
  figure,
  size,
  bodyColor,
  gapColor,
}: BrandFigureIconProps): React.JSX.Element {
  const { x, y, width, height } = BRAND_ICON_VIEWBOX[figure];
  return (
    <Svg width={size} height={size} viewBox={`${x} ${y} ${width} ${height}`}>
      {figure === 'taxi' ? (
        <TaxiIconShapes bodyColor={bodyColor} gapColor={gapColor} />
      ) : (
        <WheelIconShapes bodyColor={bodyColor} gapColor={gapColor} />
      )}
    </Svg>
  );
}
