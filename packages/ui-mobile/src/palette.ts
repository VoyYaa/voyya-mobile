export const BRAND_COLORS = {
  amber: '#F4A21A',
  amberDeep: '#E0850A',
  amberLedge: '#C8730A',
  amberInk: '#6B4505',
  amberTint: '#FCE9C6',
  espresso: '#2A2018',
  espresso800: '#3A2D21',
  espresso700: '#4A3A2C',
  espresso600: '#5C4A3A',
  espresso500: '#6B5A47',
  espressoRaised: '#352A1F',
  crema: '#FBF6ED',
  cremaDeep: '#F3EAD9',
  cremaHairline: '#EADFC9',
  go: '#12A46A',
  goSolid: '#0D774D',
  goInk: '#0A6A44',
  goTint: '#DDF1E7',
  danger: '#D6503F',
  dangerSolid: '#B23A2C',
  dangerInk: '#A63325',
  dangerTint: '#F6DED4',
  info: '#2D6A8E',
  infoInk: '#1F5272',
  infoTint: '#DCEBF3',
  sand: '#8F7F68',
} as const;

export interface ColorTokens {
  bg: string;
  surfaceSunken: string;
  surface: string;
  surfaceRaised: string;
  surfaceAlt: string;
  stage: string;
  stageRaised: string;
  onStage: string;
  onStageMuted: string;
  stageLine: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  border: string;
  borderStrong: string;
  brand: string;
  brandPressed: string;
  brandLedge: string;
  brandInk: string;
  onBrand: string;
  brandTint: string;
  success: string;
  successInk: string;
  successTint: string;
  onSuccess: string;
  successSolid: string;
  onSuccessSolid: string;
  danger: string;
  dangerTint: string;
  dangerInk: string;
  dangerSolid: string;
  onDanger: string;
  info: string;
  infoTint: string;
  infoInk: string;
  warningTint: string;
  warningInk: string;
  focusRing: string;
  focusHalo: string;
}

export const lightColors: ColorTokens = {
  bg: BRAND_COLORS.crema,
  surfaceSunken: BRAND_COLORS.cremaDeep,
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceAlt: BRAND_COLORS.amberTint,
  stage: BRAND_COLORS.espresso,
  stageRaised: BRAND_COLORS.espressoRaised,
  onStage: BRAND_COLORS.crema,
  onStageMuted: '#CBBFAD',
  stageLine: 'rgba(251, 246, 237, 0.12)',
  text: BRAND_COLORS.espresso,
  textMuted: BRAND_COLORS.espresso600,
  textSubtle: BRAND_COLORS.espresso500,
  border: BRAND_COLORS.cremaHairline,
  borderStrong: BRAND_COLORS.sand,
  brand: BRAND_COLORS.amber,
  brandPressed: BRAND_COLORS.amberDeep,
  brandLedge: BRAND_COLORS.amberLedge,
  brandInk: BRAND_COLORS.amberInk,
  onBrand: BRAND_COLORS.espresso,
  brandTint: BRAND_COLORS.amberTint,
  success: BRAND_COLORS.go,
  successInk: BRAND_COLORS.goInk,
  successTint: BRAND_COLORS.goTint,
  onSuccess: BRAND_COLORS.espresso,
  successSolid: BRAND_COLORS.goSolid,
  onSuccessSolid: '#FFFFFF',
  danger: BRAND_COLORS.danger,
  dangerTint: BRAND_COLORS.dangerTint,
  dangerInk: BRAND_COLORS.dangerInk,
  dangerSolid: BRAND_COLORS.dangerSolid,
  onDanger: '#FFFFFF',
  info: BRAND_COLORS.info,
  infoTint: BRAND_COLORS.infoTint,
  infoInk: BRAND_COLORS.infoInk,
  warningTint: BRAND_COLORS.amberTint,
  warningInk: BRAND_COLORS.amberInk,
  focusRing: BRAND_COLORS.espresso,
  focusHalo: 'rgba(244, 162, 26, 0.45)',
};

export const darkColors: ColorTokens = {
  bg: '#1C140D',
  surfaceSunken: '#231A12',
  surface: BRAND_COLORS.espresso,
  surfaceRaised: BRAND_COLORS.espressoRaised,
  surfaceAlt: 'rgba(244, 162, 26, 0.14)',
  stage: BRAND_COLORS.espresso,
  stageRaised: BRAND_COLORS.espressoRaised,
  onStage: BRAND_COLORS.crema,
  onStageMuted: '#CBBFAD',
  stageLine: 'rgba(251, 246, 237, 0.12)',
  text: BRAND_COLORS.crema,
  textMuted: '#CBBFAD',
  textSubtle: '#A39580',
  border: 'rgba(234, 223, 201, 0.16)',
  borderStrong: '#8A7A66',
  brand: BRAND_COLORS.amber,
  brandPressed: BRAND_COLORS.amberDeep,
  brandLedge: BRAND_COLORS.amberLedge,
  brandInk: BRAND_COLORS.amber,
  onBrand: BRAND_COLORS.espresso,
  brandTint: 'rgba(244, 162, 26, 0.14)',
  success: BRAND_COLORS.go,
  successInk: '#22C285',
  successTint: 'rgba(18, 164, 106, 0.16)',
  onSuccess: BRAND_COLORS.espresso,
  successSolid: BRAND_COLORS.goSolid,
  onSuccessSolid: '#FFFFFF',
  danger: BRAND_COLORS.danger,
  dangerTint: '#3A211B',
  dangerInk: '#E8705C',
  dangerSolid: BRAND_COLORS.dangerSolid,
  onDanger: '#FFFFFF',
  info: '#7DB8D8',
  infoTint: 'rgba(125, 184, 216, 0.14)',
  infoInk: '#7DB8D8',
  warningTint: 'rgba(244, 162, 26, 0.14)',
  warningInk: BRAND_COLORS.amber,
  focusRing: BRAND_COLORS.crema,
  focusHalo: 'rgba(244, 162, 26, 0.45)',
};
