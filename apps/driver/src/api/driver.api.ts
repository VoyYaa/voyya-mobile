import {
  DriverError,
  DriverHomeState,
  DriverShiftState,
  PendingCashTripsResponse,
  ReportDriverLocationDTO,
  ReportDriverLocationResult,
  UpdateDriverShiftDTO,
} from '@voyyaa/shared';
import { driverRequest } from './driver-request';

export function updateDriverShift(dto: UpdateDriverShiftDTO): Promise<DriverShiftState> {
  const body = UpdateDriverShiftDTO.parse(dto);
  return driverRequest(
    { method: 'PUT', path: '/driver/shift', body },
    DriverShiftState,
    DriverError,
  );
}

export function reportDriverLocation(
  dto: ReportDriverLocationDTO,
): Promise<ReportDriverLocationResult> {
  const body = ReportDriverLocationDTO.parse(dto);
  return driverRequest(
    { method: 'POST', path: '/driver/location', body },
    ReportDriverLocationResult,
    DriverError,
  );
}

export function getDriverHome(): Promise<DriverHomeState> {
  return driverRequest({ method: 'GET', path: '/driver/me' }, DriverHomeState, DriverError);
}

export function listPendingCashTrips(): Promise<PendingCashTripsResponse> {
  return driverRequest(
    { method: 'GET', path: '/driver/trips/cash-pending' },
    PendingCashTripsResponse,
    DriverError,
  );
}
