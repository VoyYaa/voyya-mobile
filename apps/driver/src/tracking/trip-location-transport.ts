import type { LocationAccuracy, SharingStatus } from './sharing-machine';

export interface TripLocationTransport {
  start: (intervalSec: number) => Promise<void>;
  stop: () => Promise<void>;
  readAccuracy: () => Promise<LocationAccuracy>;
  readNotificationsGranted: () => Promise<boolean | null>;
}

export interface TransportSwitchHost {
  getStatus: () => SharingStatus;
  resetMachine: () => void;
  enqueue: (task: () => Promise<void>) => void;
  whenIdle: () => Promise<void>;
}

export interface TransportSwitch {
  current: () => TripLocationTransport;
  swap: (next: TripLocationTransport) => void;
  readAccuracy: () => Promise<LocationAccuracy>;
  readNotificationsGranted: () => Promise<boolean | null>;
}

function ignoreFailure(): void {
  return undefined;
}

export function createTransportSwitch(
  initial: TripLocationTransport,
  host: TransportSwitchHost,
): TransportSwitch {
  let current = initial;
  let target = initial;

  return {
    current: () => current,
    swap: (next) => {
      if (next === target) return;
      target = next;
      if (host.getStatus() === 'running') host.resetMachine();
      host.enqueue(async () => {
        await current.stop().catch(ignoreFailure);
        current = next;
      });
    },
    readAccuracy: async () => {
      await host.whenIdle();
      return current.readAccuracy();
    },
    readNotificationsGranted: async () => {
      await host.whenIdle();
      return current.readNotificationsGranted();
    },
  };
}
