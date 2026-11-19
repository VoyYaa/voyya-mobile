export interface ForegroundPresentation {
  shouldShowBanner: boolean;
  shouldShowList: boolean;
  shouldPlaySound: boolean;
  shouldSetBadge: boolean;
}

const TRIP_SCREEN_PATHS: readonly string[] = ['/searching', '/driver-assigned'];

export function isTripScreenPath(pathname: string): boolean {
  return TRIP_SCREEN_PATHS.includes(pathname);
}

export function foregroundPresentation(pathname: string): ForegroundPresentation {
  const visible = !isTripScreenPath(pathname);
  return {
    shouldShowBanner: visible,
    shouldShowList: visible,
    shouldPlaySound: visible,
    shouldSetBadge: false,
  };
}
