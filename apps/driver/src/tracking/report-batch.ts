import {
  pickReportableReading,
  type Reading,
  type SharingEvent,
  type SharingStatus,
  type SharingTarget,
} from './sharing-machine';

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_CONFLICT = 409;
const NOT_ON_SHIFT = 'NOT_ON_SHIFT';
const MAX_READING_AGE_INTERVALS = 2;
const MS_PER_SEC = 1000;

export interface FailureInfo {
  status: number | undefined;
  code: string | undefined;
}

export function isRejectedForGood({ status, code }: FailureInfo): boolean {
  if (status === HTTP_FORBIDDEN || status === HTTP_UNAUTHORIZED) return true;
  return status === HTTP_CONFLICT && code === NOT_ON_SHIFT;
}

export function dropStaleReadings(
  readings: readonly Reading[],
  now: number,
  intervalSec: number,
): Reading[] {
  const maxAgeMs = MAX_READING_AGE_INTERVALS * intervalSec * MS_PER_SEC;
  return readings.filter((reading) => now - reading.timestamp <= maxAgeMs);
}

export interface ReportBatchPorts {
  now: () => number;
  getStatus: () => SharingStatus;
  getIntervalSec: () => number | null;
  dispatch: (event: SharingEvent) => void;
  noteGoodReading: (now: number) => void;
  report: (coords: { lat: number; lng: number }) => Promise<{
    location_sharing: SharingTarget | null;
  }>;
  describeFailure: (error: unknown) => FailureInfo;
  onRejectedForGood: (info: FailureInfo) => void;
  maxAccuracyM: number;
}

export async function reportBatch(
  readings: readonly Reading[],
  ports: ReportBatchPorts,
): Promise<void> {
  const now = ports.now();
  ports.dispatch({ type: 'tick', now });
  const intervalSec = ports.getIntervalSec();
  if (ports.getStatus() !== 'running' || intervalSec === null) return;
  const reading = pickReportableReading(
    dropStaleReadings(readings, now, intervalSec),
    ports.maxAccuracyM,
  );
  if (reading === null) return;
  ports.noteGoodReading(now);
  try {
    const result = await ports.report({ lat: reading.latitude, lng: reading.longitude });
    ports.dispatch({ type: 'report_result', sharing: result.location_sharing });
  } catch (error) {
    const info = ports.describeFailure(error);
    if (!isRejectedForGood(info)) return;
    ports.onRejectedForGood(info);
    ports.dispatch({ type: 'report_forbidden' });
  }
}
