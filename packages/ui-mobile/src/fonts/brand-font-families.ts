export const BRAND_FONT_FAMILY = {
  400: 'Nunito-Regular',
  700: 'Nunito-Bold',
  800: 'Nunito-ExtraBold',
  900: 'Nunito-Black',
} as const;

export type BrandFontWeight = keyof typeof BRAND_FONT_FAMILY;

export type BrandFontFamilyName = (typeof BRAND_FONT_FAMILY)[BrandFontWeight];
