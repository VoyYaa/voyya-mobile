import type { Coordinate } from '@voyyaa/shared';
import { reportBatch, type ReportBatchPorts } from './report-batch';
import type { TripLocationTransport } from './trip-location-transport';

export const DEMO_READING_ACCURACY_M = 5;
const MS_PER_SEC = 1000;

export interface FixedPointTransportDeps {
  center: Coordinate;
  batchPorts: ReportBatchPorts;
  isForeground: () => boolean;
  setTimer: (handler: () => void, ms: number) => unknown;
  clearTimer: (handle: unknown) => void;
  now: () => number;
}

export function createFixedPointTransport(deps: FixedPointTransportDeps): TripLocationTransport {
  let timer: unknown = null;

  const clear = (): void => {
    if (timer === null) return;
    deps.clearTimer(timer);
    timer = null;
  };

  const tick = (): void => {
    if (!deps.isForeground()) return;
    void reportBatch(
      [
        {
          latitude: deps.center.lat,
          longitude: deps.center.lng,
          accuracy: DEMO_READING_ACCURACY_M,
          timestamp: deps.now(),
        },
      ],
      deps.batchPorts,
    );
  };

  return {
    start: async (intervalSec) => {
      clear();
      tick();
      timer = deps.setTimer(tick, intervalSec * MS_PER_SEC);
    },
    stop: async () => {
      clear();
    },
    readAccuracy: async () => 'fine',
    readNotificationsGranted: async () => true,
  };
}
