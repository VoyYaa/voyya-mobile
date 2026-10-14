import { create } from 'zustand';
import {
  assignedSeed,
  detectTripTransition,
  type TripSnapshot,
  type TripTransitionNotice,
} from '../lib/trip-transition';

export interface TransitionNoticeEntry {
  id: number;
  tripRequestId: number;
  kind: TripTransitionNotice;
  toastShown: boolean;
}

interface TripTransitionState {
  lastSeen: TripSnapshot | null;
  notice: TransitionNoticeEntry | null;

  observe: (snapshot: TripSnapshot) => TripTransitionNotice | null;
  seedAssigned: (tripRequestId: number) => void;
  markToastShown: (id: number) => void;
}

let nextNoticeId = 1;

export const useTripTransitionStore = create<TripTransitionState>((set, get) => ({
  lastSeen: null,
  notice: null,

  observe: (snapshot) => {
    const { lastSeen, notice } = get();
    const kind = detectTripTransition(lastSeen, snapshot);
    const sameTrip = notice?.tripRequestId === snapshot.tripRequestId;
    set({
      lastSeen: snapshot,
      notice: kind
        ? { id: nextNoticeId++, tripRequestId: snapshot.tripRequestId, kind, toastShown: false }
        : sameTrip
          ? notice
          : null,
    });
    return kind;
  },

  seedAssigned: (tripRequestId) => {
    const seed = assignedSeed(get().lastSeen, tripRequestId);
    if (seed !== null) set({ lastSeen: seed });
  },

  markToastShown: (id) =>
    set((state) =>
      state.notice !== null && state.notice.id === id
        ? { notice: { ...state.notice, toastShown: true } }
        : state,
    ),
}));
