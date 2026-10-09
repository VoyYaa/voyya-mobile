import { create } from 'zustand';

export type ShiftActivationPhase =
  | 'idle'
  | 'requesting_permission'
  | 'activating'
  | 'permission_denied'
  | 'gps_disabled'
  | 'location_timeout'
  | 'blocked_by_trip'
  | 'consent_required'
  | 'offline'
  | 'server_error';

type ShiftAction = 'activate' | 'deactivate';

interface ShiftUiState {
  phase: ShiftActivationPhase;
  lastAction: ShiftAction | null;
  setPhase: (phase: ShiftActivationPhase) => void;
  setLastAction: (action: ShiftAction | null) => void;
}

export const useShiftStore = create<ShiftUiState>((set) => ({
  phase: 'idle',
  lastAction: null,
  setPhase: (phase) => set({ phase }),
  setLastAction: (lastAction) => set({ lastAction }),
}));
