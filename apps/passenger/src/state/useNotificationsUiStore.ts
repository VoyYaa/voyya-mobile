import { create } from 'zustand';

interface NotificationsUiState {
  dismissedTripId: number | null;
  confirmed: boolean;
  decisionCount: number;

  dismissBanner: (tripRequestId: number) => void;
  setConfirmed: (confirmed: boolean) => void;
  registerDecision: () => void;
}

export const useNotificationsUiStore = create<NotificationsUiState>((set) => ({
  dismissedTripId: null,
  confirmed: false,
  decisionCount: 0,

  dismissBanner: (tripRequestId) => set({ dismissedTripId: tripRequestId }),
  setConfirmed: (confirmed) => set({ confirmed }),
  registerDecision: () => set((state) => ({ decisionCount: state.decisionCount + 1 })),
}));
