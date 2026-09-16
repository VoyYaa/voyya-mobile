import { z } from 'zod';
import {
  DriverError,
  DriverHomeState,
  DriverShiftState,
  PendingCashTripsResponse,
  ReportDriverLocationDTO,
  UpdateDriverShiftDTO,
} from '@voyyaa/shared';
import { apiRequest } from '@voyyaa/app-runtime';

const LocationReported = z.object({ ok: z.literal(true) });

export function updateDriverShift(dto: UpdateDriverShiftDTO): Promise<DriverShiftState> {
  const body = UpdateDriverShiftDTO.parse(dto);
  return apiRequest({ method: 'PUT', path: '/driver/shift', body }, DriverShiftState, DriverError);
}

export function reportDriverLocation(
  dto: ReportDriverLocationDTO,
): Promise<z.infer<typeof LocationReported>> {
  const body = ReportDriverLocationDTO.parse(dto);
  return apiRequest(
    { method: 'POST', path: '/driver/location', body },
    LocationReported,
    DriverError,
  );
}

export function getDriverHome(): Promise<DriverHomeState> {
  return apiRequest({ method: 'GET', path: '/driver/me' }, DriverHomeState, DriverError);
}

export function listPendingCashTrips(): Promise<PendingCashTripsResponse> {
  return apiRequest(
    { method: 'GET', path: '/driver/trips/cash-pending' },
    PendingCashTripsResponse,
    DriverError,
  );
}
