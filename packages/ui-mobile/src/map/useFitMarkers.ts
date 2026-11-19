import { useRef } from 'react';
import { fitMarkersChanged } from './camera-plan';
import type { MapMarker } from './types';

export function useFitMarkers(
  markers: readonly MapMarker[],
  frozen: boolean,
): readonly MapMarker[] {
  const held = useRef<readonly MapMarker[]>(markers);
  if (!frozen && fitMarkersChanged(held.current, markers)) held.current = markers;
  return held.current;
}
