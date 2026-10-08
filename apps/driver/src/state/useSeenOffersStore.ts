import { create } from 'zustand';

interface SeenOffersState {
  seenIds: readonly number[];
  markSeen: (ids: readonly number[]) => void;
}

export const useSeenOffersStore = create<SeenOffersState>((set) => ({
  seenIds: [],
  markSeen: (ids) => set((state) => ({ seenIds: [...new Set([...state.seenIds, ...ids])] })),
}));
