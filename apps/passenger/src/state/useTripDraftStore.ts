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

  setOrigin: (origin: Location, source: OriginSource) => void;
  clearOrigin: () => void;
  setOriginDestination: (origin: Location, destination: Location) => void;
  setQuote: (quote: QuoteResponse) => void;
  reset: () => void;
}

const YARUMAL_MUNICIPALITY_ID = 1;

export const useTripDraftStore = create<TripDraftState>((set) => ({
  origin: null,
  originSource: null,
  destination: null,
  serviceType: 'taxi',
  municipalityId: YARUMAL_MUNICIPALITY_ID,
  quote: null,

  setOrigin: (origin, originSource) => set({ origin, originSource }),
  clearOrigin: () => set({ origin: null, originSource: null }),
  setOriginDestination: (origin, destination) => set({ origin, destination }),
  setQuote: (quote) => set({ quote }),
  reset: () =>
    set({
      origin: null,
      originSource: null,
      destination: null,
      serviceType: 'taxi',
      quote: null,
    }),
}));
