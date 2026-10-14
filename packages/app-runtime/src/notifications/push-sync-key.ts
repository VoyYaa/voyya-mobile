export type PushSyncKey = 'guest' | 'authenticated' | 'authenticated_pin_pending';

export interface PushSyncSessionState {
  status: 'hydrating' | 'authenticated' | 'guest';
  user: { pin_change_required?: boolean } | null;
}

export function pushSyncKey(state: PushSyncSessionState): PushSyncKey {
  if (state.status !== 'authenticated') return 'guest';
  return state.user?.pin_change_required === true ? 'authenticated_pin_pending' : 'authenticated';
}
