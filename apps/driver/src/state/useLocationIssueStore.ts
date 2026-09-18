import { create } from 'zustand';

export type LocationIssueKind = 'permission_denied' | 'gps_disabled';

interface LocationIssueState {
  issue: LocationIssueKind | null;
  setIssue: (issue: LocationIssueKind | null) => void;
}

export const useLocationIssueStore = create<LocationIssueState>((set) => ({
  issue: null,
  setIssue: (issue) => set({ issue }),
}));
