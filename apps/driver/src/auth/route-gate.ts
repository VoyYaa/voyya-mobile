export type GateSessionStatus = 'hydrating' | 'authenticated' | 'guest';
export type GateRedirect = '/(auth)/login' | '/(auth)/create-pin' | '/';

export interface RouteGateInput {
  status: GateSessionStatus;
  inAuthGroup: boolean;
  onCreatePin: boolean;
  pinRequired: boolean;
  celebrating: boolean;
}

export function resolveGateRedirect(input: RouteGateInput): GateRedirect | null {
  if (input.status === 'hydrating') return null;
  if (input.status === 'guest') {
    return !input.inAuthGroup || input.onCreatePin ? '/(auth)/login' : null;
  }
  if (input.pinRequired) return input.onCreatePin ? null : '/(auth)/create-pin';
  if (input.onCreatePin && input.celebrating) return null;
  return input.inAuthGroup ? '/' : null;
}
