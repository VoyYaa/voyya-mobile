import { create } from 'zustand';
import { onSessionCleared } from '@voyyaa/app-runtime';
import {
  INITIAL_SHARING_STATE,
  sharingReducer,
  type LocationAccuracy,
  type SharingEffect,
  type SharingEvent,
  type SharingState,
} from './sharing-machine';
import { startTripLocationUpdates, stopTripLocationUpdates } from './location-service';

interface SharingStoreState {
  machine: SharingState;
  lastReadingAt: number | null;
  notificationsGranted: boolean | null;
  accuracy: LocationAccuracy;
}

export const useSharingStore = create<SharingStoreState>(() => ({
  machine: INITIAL_SHARING_STATE,
  lastReadingAt: null,
  notificationsGranted: null,
  accuracy: 'unknown',
}));

let effectChain: Promise<void> = Promise.resolve();

async function runEffect(effect: SharingEffect): Promise<void> {
  if (effect.type === 'stop') {
    await stopTripLocationUpdates().catch(() => undefined);
    return;
  }
  try {
    await startTripLocationUpdates(effect.intervalSec);
  } catch {
    dispatchSharing({ type: 'start_failed' });
  }
}

function enqueue(effect: SharingEffect): void {
  effectChain = effectChain.then(() => runEffect(effect));
}

export function dispatchSharing(event: SharingEvent): void {
  const { machine } = useSharingStore.getState();
  const { state, effects } = sharingReducer(machine, event);
  const restarted = effects.some((effect) => effect.type === 'start');
  useSharingStore.setState(
    restarted ? { machine: state, lastReadingAt: null } : { machine: state },
  );
  effects.forEach(enqueue);
}

export function stopOrphanedTripLocation(): void {
  if (useSharingStore.getState().machine.status === 'running') return;
  enqueue({ type: 'stop', reason: 'orphan_cleanup' });
}

onSessionCleared(() => {
  dispatchSharing({ type: 'report_result', sharing: null });
});

export function noteGoodReading(now: number): void {
  useSharingStore.setState({ lastReadingAt: now });
}

export function setSharingEnvironment(
  environment: Partial<Pick<SharingStoreState, 'notificationsGranted' | 'accuracy'>>,
): void {
  useSharingStore.setState(environment);
}
