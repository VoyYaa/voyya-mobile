import { create } from 'zustand';

export type ShiftActivationPhase =
  | 'idle'
  | 'requesting_permission'
  | 'activating'
  | 'permission_denied'
  | 'gps_disabled'
  | 'blocked_by_trip'
  | 'offline'
  | 'server_error';

interface ShiftUiState {
  phase: ShiftActivationPhase;
  lastAction: 'activate' | 'deactivate' | null;
  setPhase: (phase: ShiftActivationPhase) => void;
  setLastAction: (action: 'activate' | 'deactivate' | null) => void;
}

export const useShiftStore = create<ShiftUiState>((set) => ({
  phase: 'idle',
  lastAction: null,
  setPhase: (phase) => set({ phase }),
  setLastAction: (lastAction) => set({ lastAction }),
}));
