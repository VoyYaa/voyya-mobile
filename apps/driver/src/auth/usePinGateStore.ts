import { create } from 'zustand';
import { useSessionStore } from '@voyyaa/app-runtime';

interface PinGateState {
  forced: boolean;
  celebrating: boolean;
  setForced: (forced: boolean) => void;
  setCelebrating: (celebrating: boolean) => void;
}

export const usePinGateStore = create<PinGateState>((set) => ({
  forced: false,
  celebrating: false,
  setForced: (forced) => set({ forced }),
  setCelebrating: (celebrating) => set({ celebrating }),
}));

export function usePinChangeRequired(): boolean {
  const claimed = useSessionStore((s) => s.user?.pin_change_required === true);
  const forced = usePinGateStore((s) => s.forced);
  return claimed || forced;
}
