import { create } from 'zustand';
import type { Location, QuoteResponse, ServiceType } from '@voyyaa/shared';

export type OriginSource = 'gps' | 'manual';

interface TripDraftState {
  origin: Location | null;
  originSource: OriginSource | null;
  destination: Location | null;
  serviceType: ServiceType;
  municipalityId: number;
  quote: QuoteResponse | null;
  assignedAtLocal: string | null;

  setOrigin: (origin: Location, source: OriginSource) => void;
  clearOrigin: () => void;
  setOriginDestination: (origin: Location, destination: Location) => void;
  setServiceType: (serviceType: ServiceType) => void;
  setQuote: (quote: QuoteResponse) => void;
  markAssignedLocal: () => void;
  reset: () => void;
}

const YARUMAL_MUNICIPALITY_ID = 1;

export const useTripDraftStore = create<TripDraftState>((set, get) => ({
  origin: null,
  originSource: null,
  destination: null,
  serviceType: 'taxi',
  municipalityId: YARUMAL_MUNICIPALITY_ID,
  quote: null,
  assignedAtLocal: null,

  setOrigin: (origin, originSource) => set({ origin, originSource }),
  clearOrigin: () => set({ origin: null, originSource: null }),
  setOriginDestination: (origin, destination) => set({ origin, destination }),
  setServiceType: (serviceType) => set({ serviceType }),
  setQuote: (quote) => set({ quote }),
  markAssignedLocal: () => {
    if (!get().assignedAtLocal) {
      set({ assignedAtLocal: new Date().toISOString() });
    }
  },
  reset: () =>
    set({
      origin: null,
      originSource: null,
      destination: null,
      serviceType: 'taxi',
      quote: null,
      assignedAtLocal: null,
    }),
}));
