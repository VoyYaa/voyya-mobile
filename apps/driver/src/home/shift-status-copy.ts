import { homeCopy } from '../copy/home-copy';

export interface ShiftStatusInput {
  onShift: boolean;
  consentPending: boolean;
}

export interface ShiftHeroText {
  title: string;
  body: string | null;
}

export function shiftHeroText({ onShift, consentPending }: ShiftStatusInput): ShiftHeroText {
  if (!onShift) return { title: homeCopy.offShiftTitle, body: homeCopy.offShiftBody };
  if (consentPending) {
    return { title: homeCopy.consentPendingTitle, body: homeCopy.consentPendingBody };
  }
  return { title: homeCopy.waitingTitle, body: null };
}

export function shiftSwitchHint({
  consentPending,
}: Pick<ShiftStatusInput, 'consentPending'>): string | null {
  return consentPending ? homeCopy.consentPendingHint : null;
}
