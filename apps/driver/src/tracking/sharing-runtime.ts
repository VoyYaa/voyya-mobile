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
import { defaultTripLocationTransport } from './default-trip-location-transport';
import { createTransportSwitch, type TripLocationTransport } from './trip-location-transport';

interface SharingStoreState {
  machine: SharingState;
  lastReadingAt: number | null;
  intervalSec: number | null;
  notificationsGranted: boolean | null;
  accuracy: LocationAccuracy;
}

export const useSharingStore = create<SharingStoreState>(() => ({
  machine: INITIAL_SHARING_STATE,
  lastReadingAt: null,
  intervalSec: null,
  notificationsGranted: null,
  accuracy: 'unknown',
}));

let effectChain: Promise<void> = Promise.resolve();

const transportSwitch = createTransportSwitch(defaultTripLocationTransport, {
  getStatus: () => useSharingStore.getState().machine.status,
  resetMachine: () => dispatchSharing({ type: 'report_result', sharing: null }),
  enqueue: (task) => {
    effectChain = effectChain.then(task);
  },
  whenIdle: () => effectChain,
});

async function runEffect(effect: SharingEffect): Promise<void> {
  const transport = transportSwitch.current();
  if (effect.type === 'stop') {
    await transport.stop().catch(() => undefined);
    return;
  }
  try {
    await transport.start(effect.intervalSec);
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
  const started = effects.find((effect) => effect.type === 'start');
  useSharingStore.setState(
    started?.type === 'start'
      ? { machine: state, lastReadingAt: null, intervalSec: started.intervalSec }
      : { machine: state },
  );
  effects.forEach(enqueue);
}

export function swapTripLocationTransport(next: TripLocationTransport): void {
  transportSwitch.swap(next);
}

export const readTripLocationAccuracy = transportSwitch.readAccuracy;

export const readTripLocationNotificationsGranted = transportSwitch.readNotificationsGranted;

export function stopOrphanedTripLocation(): void {
  if (useSharingStore.getState().machine.status === 'running') return;
  enqueue({ type: 'stop', reason: 'orphan_cleanup' });
}

onSessionCleared(() => {
  dispatchSharing({ type: 'report_result', sharing: null });
  swapTripLocationTransport(defaultTripLocationTransport);
});

export function noteGoodReading(now: number): void {
  useSharingStore.setState({ lastReadingAt: now });
}

export function setSharingEnvironment(
  environment: Partial<Pick<SharingStoreState, 'notificationsGranted' | 'accuracy'>>,
): void {
  useSharingStore.setState(environment);
}
