import { PIN_POINT_ADDRESS } from '../constants/pin-point';
import { placeCopy } from '../copy/place-copy';

export type PointSource = 'gps' | 'manual';

export type ReferenceView = 'add' | 'edit' | 'show';

export function presentAddress(address: string): string {
  if (!address.startsWith(PIN_POINT_ADDRESS)) return address;
  return `${placeCopy.pinPoint}${address.slice(PIN_POINT_ADDRESS.length)}`;
}

export function pointTag(address: string, source: PointSource | null): string | null {
  if (source === 'gps') return placeCopy.tagGps;
  if (address.startsWith(PIN_POINT_ADDRESS)) return placeCopy.tagManual;
  return null;
}

export function referenceView(reference: string, editing: boolean): ReferenceView {
  if (editing) return 'edit';
  return reference.trim() ? 'show' : 'add';
}
