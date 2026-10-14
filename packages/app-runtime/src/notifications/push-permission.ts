export type PushPermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface PushPermissionSnapshot {
  status: PushPermissionStatus;
  canAskAgain: boolean;
}

export interface ExpoPermissionResponse {
  status: string;
  canAskAgain: boolean;
  granted: boolean;
}

function toStatus(status: string): PushPermissionStatus {
  if (status === 'granted') return 'granted';
  return status === 'denied' ? 'denied' : 'undetermined';
}

export function toPermissionSnapshot(response: ExpoPermissionResponse): PushPermissionSnapshot {
  const status = toStatus(response.status);
  const disabledInSettings = status === 'denied' && response.granted;
  return { status, canAskAgain: response.canAskAgain && !disabledInSettings };
}

export type PushPermission = 'unsupported' | 'undetermined' | 'askable' | 'blocked' | 'granted';

export interface PermissionContext {
  channelEnabled: boolean;
  askedBefore: boolean;
}

export function derivePushPermission(
  snapshot: PushPermissionSnapshot,
  context: PermissionContext,
): PushPermission {
  if (snapshot.status === 'granted') return context.channelEnabled ? 'granted' : 'blocked';
  if (snapshot.status === 'undetermined') return 'undetermined';
  if (!snapshot.canAskAgain) return 'blocked';
  return context.askedBefore ? 'askable' : 'undetermined';
}

export function canRequestPushPermission(permission: PushPermission): boolean {
  return permission === 'undetermined' || permission === 'askable';
}
