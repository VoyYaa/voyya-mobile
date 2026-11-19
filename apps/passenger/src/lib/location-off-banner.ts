import type { OriginSource } from '../state/useTripDraftStore';

export interface LocationOffInput {
  originSource: OriginSource | null;
  hasOrigin: boolean;
  servicesEnabled: boolean | null;
  tripActive: boolean;
  demo?: boolean;
}

export function isLocationOffWithManualOrigin(input: LocationOffInput): boolean {
  return (
    !input.demo &&
    input.hasOrigin &&
    input.originSource === 'manual' &&
    input.servicesEnabled === false &&
    !input.tripActive
  );
}
