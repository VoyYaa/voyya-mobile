export type AppStateStatusLike = 'active' | 'background' | 'inactive' | 'unknown' | 'extension';

export interface AppStatePort {
  addEventListener: (
    type: 'change',
    listener: (status: AppStateStatusLike) => void,
  ) => { remove: () => void };
}

export interface NetworkStateLike {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

export interface NetworkPort {
  addEventListener: (listener: (state: NetworkStateLike) => void) => () => void;
}

export interface FocusManagerPort {
  setEventListener(setup: (setFocused: (focused?: boolean) => void) => (() => void) | void): void;
}

export interface OnlineManagerPort {
  setEventListener(setup: (setOnline: (online: boolean) => void) => (() => void) | void): void;
}

export function wireFocusToAppState(appState: AppStatePort, focusManager: FocusManagerPort): void {
  focusManager.setEventListener((setFocused) => {
    const subscription = appState.addEventListener('change', (status) =>
      setFocused(status === 'active'),
    );
    return () => subscription.remove();
  });
}

export function isOnlineState(state: NetworkStateLike): boolean {
  return Boolean(state.isConnected) && state.isInternetReachable !== false;
}

export function wireOnlineToNetwork(network: NetworkPort, onlineManager: OnlineManagerPort): void {
  onlineManager.setEventListener((setOnline) =>
    network.addEventListener((state) => setOnline(isOnlineState(state))),
  );
}
