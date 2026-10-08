import { create } from 'zustand';
import type { Location, QuoteResponse, ActivatableServiceType } from '@voyyaa/shared';
import type { DriverIdentity } from '../lib/driver-change';
import { ANY_COMPANY, type CompanyPreference } from '../lib/company-selection';

export interface LastAssignedDriver {
  tripRequestId: number;
  identity: DriverIdentity;
}

export type OriginSource = 'gps' | 'manual';

interface TripDraftState {
  origin: Location | null;
  originSource: OriginSource | null;
  destination: Location | null;
  serviceType: ActivatableServiceType;
  quote: QuoteResponse | null;
  companyPreference: CompanyPreference;
  unavailableCompanyName: string | null;
  lastAssignedDriver: LastAssignedDriver | null;

  setOrigin: (origin: Location, source: OriginSource) => void;
  clearOrigin: () => void;
  setOriginDestination: (origin: Location, destination: Location) => void;
  setQuote: (quote: QuoteResponse) => void;
  setCompanyPreference: (preference: CompanyPreference) => void;
  markCompanyUnavailable: (companyName: string) => void;
  setLastAssignedDriver: (driver: LastAssignedDriver) => void;
  reset: () => void;
}

export const useTripDraftStore = create<TripDraftState>((set) => ({
  origin: null,
  originSource: null,
  destination: null,
  serviceType: 'taxi',
  quote: null,
  companyPreference: ANY_COMPANY,
  unavailableCompanyName: null,
  lastAssignedDriver: null,

  setOrigin: (origin, originSource) => set({ origin, originSource }),
  clearOrigin: () => set({ origin: null, originSource: null }),
  setOriginDestination: (origin, destination) => set({ origin, destination }),
  setQuote: (quote) => set({ quote }),
  setCompanyPreference: (companyPreference) =>
    set((state) => ({
      companyPreference,
      unavailableCompanyName: companyPreference === null ? state.unavailableCompanyName : null,
    })),
  markCompanyUnavailable: (companyName) =>
    set({ companyPreference: null, unavailableCompanyName: companyName }),
  setLastAssignedDriver: (lastAssignedDriver) => set({ lastAssignedDriver }),
  reset: () =>
    set({
      origin: null,
      originSource: null,
      destination: null,
      serviceType: 'taxi',
      quote: null,
      companyPreference: ANY_COMPANY,
      unavailableCompanyName: null,
      lastAssignedDriver: null,
    }),
}));
