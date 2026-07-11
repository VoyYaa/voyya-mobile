import { create } from 'zustand';

interface ShiftState {
  onShift: boolean;
  startShift: () => void;
  endShift: () => void;
  toggleShift: () => void;
}

export const useShiftStore = create<ShiftState>((set) => ({
  onShift: false,
  startShift: () => set({ onShift: true }),
  endShift: () => set({ onShift: false }),
  toggleShift: () => set((s) => ({ onShift: !s.onShift })),
}));
