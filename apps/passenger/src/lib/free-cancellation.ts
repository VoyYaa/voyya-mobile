export interface FreeCancellationReading {
  freeCancellationUntil: string | null;
  serverTime: string;
  receivedAtMs: number;
}

export function freeCancellationDeadlineMs(reading: FreeCancellationReading): number | null {
  if (reading.freeCancellationUntil === null) return null;
  const until = Date.parse(reading.freeCancellationUntil);
  const serverNow = Date.parse(reading.serverTime);
  if (Number.isNaN(until) || Number.isNaN(serverNow)) return null;
  return reading.receivedAtMs + (until - serverNow);
}

export function freeCancellationDeadlineIso(reading: FreeCancellationReading): string | null {
  const deadlineMs = freeCancellationDeadlineMs(reading);
  return deadlineMs === null ? null : new Date(deadlineMs).toISOString();
}

export function freeCancellationRemainingSec(
  reading: FreeCancellationReading,
  nowMs: number,
): number {
  const deadlineMs = freeCancellationDeadlineMs(reading);
  if (deadlineMs === null) return 0;
  return Math.max(0, Math.floor((deadlineMs - nowMs) / 1000));
}
