import type { TripCompanyOption, TripServiceOption } from '@voyyaa/shared';

export type CompanyPreference =
  { kind: 'any' } | { kind: 'company'; companyId: number; companyName: string } | null;

export const ANY_COMPANY: CompanyPreference = { kind: 'any' };

export type ServiceOptionsStatus = 'loading' | 'ready' | 'error' | 'offline';

export interface ServiceOptionsReading {
  hasData: boolean;
  isError: boolean;
  offline: boolean;
}

export function serviceOptionsStatus(reading: ServiceOptionsReading): ServiceOptionsStatus {
  if (reading.hasData) return 'ready';
  if (reading.offline) return 'offline';
  if (reading.isError) return 'error';
  return 'loading';
}

export function sortCompanies(companies: readonly TripCompanyOption[]): TripCompanyOption[] {
  return [...companies].sort(
    (a, b) =>
      a.display_name.localeCompare(b.display_name, 'es', { sensitivity: 'base' }) ||
      a.company_id - b.company_id,
  );
}

export function findServiceOption(
  services: readonly TripServiceOption[],
  serviceType: TripServiceOption['service_type'],
): TripServiceOption | null {
  return services.find((service) => service.service_type === serviceType) ?? null;
}

export function companyPreference(company: TripCompanyOption): CompanyPreference {
  return { kind: 'company', companyId: company.company_id, companyName: company.display_name };
}

export function requestedCompanyId(
  preference: CompanyPreference,
  selectionRequired: boolean,
): number | undefined {
  if (!selectionRequired || preference?.kind !== 'company') return undefined;
  return preference.companyId;
}

export function isPreferenceListed(
  preference: CompanyPreference,
  companies: readonly TripCompanyOption[],
): boolean {
  if (preference?.kind !== 'company') return true;
  return companies.some((company) => company.company_id === preference.companyId);
}

export function companyLacksDrivers(
  preference: CompanyPreference,
  companies: readonly TripCompanyOption[],
): boolean {
  if (preference?.kind !== 'company') return false;
  const company = companies.find((candidate) => candidate.company_id === preference.companyId);
  return company !== undefined && !company.has_available_drivers;
}
