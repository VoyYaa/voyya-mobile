import nunitoRegular from '../../assets/fonts/Nunito-Regular.ttf';
import nunitoBold from '../../assets/fonts/Nunito-Bold.ttf';
import nunitoExtraBold from '../../assets/fonts/Nunito-ExtraBold.ttf';
import nunitoBlack from '../../assets/fonts/Nunito-Black.ttf';
import { BRAND_FONT_FAMILY, type BrandFontFamilyName } from './brand-font-families';

export const BRAND_FONT_ASSETS: Record<BrandFontFamilyName, number> = {
  [BRAND_FONT_FAMILY[400]]: nunitoRegular,
  [BRAND_FONT_FAMILY[700]]: nunitoBold,
  [BRAND_FONT_FAMILY[800]]: nunitoExtraBold,
  [BRAND_FONT_FAMILY[900]]: nunitoBlack,
};
