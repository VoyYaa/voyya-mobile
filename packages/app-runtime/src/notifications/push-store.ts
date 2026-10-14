import { create } from 'zustand';
import type { PushPermission } from './push-permission';
import type { PushRegistrationStatus } from './push-registrar';

export interface PushState {
  permission: PushPermission | 'unknown';
  registration: PushRegistrationStatus;
  activating: boolean;
}

const INITIAL_PUSH_STATE: PushState = {
  permission: 'unknown',
  registration: 'idle',
  activating: false,
};

export const usePushStore = create<PushState>(() => INITIAL_PUSH_STATE);

export function resetPushState(): void {
  usePushStore.setState(INITIAL_PUSH_STATE);
}
