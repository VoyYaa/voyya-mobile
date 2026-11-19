export interface MapLoadState {
  ready: boolean;
  degraded: boolean;
}

export type MapLoadEvent = 'style_loaded' | 'fully_rendered' | 'failed' | 'timeout';

export const MAP_LOAD_TIMEOUT_MS = 8000;

export const INITIAL_MAP_LOAD_STATE: MapLoadState = { ready: false, degraded: false };

export function reduceMapLoad(state: MapLoadState, event: MapLoadEvent): MapLoadState {
  switch (event) {
    case 'style_loaded':
      return { ...state, ready: true };
    case 'fully_rendered':
      return { ready: true, degraded: false };
    case 'failed':
      return { ready: true, degraded: true };
    case 'timeout':
      return state.ready ? state : { ready: true, degraded: true };
  }
}
