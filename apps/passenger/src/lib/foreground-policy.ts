export interface ForegroundPresentation {
  shouldShowAlert: boolean;
  shouldPlaySound: boolean;
  shouldSetBadge: boolean;
}

const TRIP_SCREEN_PATHS: readonly string[] = ['/searching', '/driver-assigned'];

export function isTripScreenPath(pathname: string): boolean {
  return TRIP_SCREEN_PATHS.includes(pathname);
}

export function foregroundPresentation(pathname: string): ForegroundPresentation {
  const visible = !isTripScreenPath(pathname);
  return { shouldShowAlert: visible, shouldPlaySound: visible, shouldSetBadge: false };
}
