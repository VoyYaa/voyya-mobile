import type { AssignedDriverSummary } from '@voyyaa/shared';

export interface DriverIdentity {
  name: string;
  plate: string;
  companyId: number;
}

export function driverIdentity(driver: AssignedDriverSummary): DriverIdentity {
  return { name: driver.name, plate: driver.plate, companyId: driver.company.company_id };
}

export function driverChanged(
  previous: DriverIdentity | null,
  current: DriverIdentity | null,
): boolean {
  if (previous === null || current === null) return false;
  return (
    previous.name !== current.name ||
    previous.plate !== current.plate ||
    previous.companyId !== current.companyId
  );
}
