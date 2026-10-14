export const OTP_BOX_WIDTH_MAX = 56;
export const OTP_BOX_GAP_MAX = 10;
export const OTP_BOX_WIDTH_FLOOR = 30;
export const OTP_BOX_GAP_FLOOR = 4;
export const OTP_BOX_HEIGHT = 64;

export interface OtpBoxLayout {
  boxWidth: number;
  boxGap: number;
  totalWidth: number;
}

export function naturalOtpWidth(length: number): number {
  return length * OTP_BOX_WIDTH_MAX + (length - 1) * OTP_BOX_GAP_MAX;
}

function scaled(maximum: number, availableWidth: number, naturalWidth: number): number {
  if (availableWidth >= naturalWidth) return maximum;
  return Math.floor((maximum * availableWidth) / naturalWidth);
}

export function fitOtpBoxes(length: number, availableWidth: number): OtpBoxLayout {
  const naturalWidth = naturalOtpWidth(length);
  const width =
    Number.isFinite(availableWidth) && availableWidth > 0 ? availableWidth : naturalWidth;
  const boxWidth = Math.max(OTP_BOX_WIDTH_FLOOR, scaled(OTP_BOX_WIDTH_MAX, width, naturalWidth));
  const boxGap = Math.max(OTP_BOX_GAP_FLOOR, scaled(OTP_BOX_GAP_MAX, width, naturalWidth));
  return { boxWidth, boxGap, totalWidth: length * boxWidth + (length - 1) * boxGap };
}
