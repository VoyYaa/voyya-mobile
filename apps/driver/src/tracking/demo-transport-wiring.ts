import { AppState } from 'react-native';
import { useSessionStore } from '@voyyaa/app-runtime';
import { reportDriverLocation } from '../api/driver.api';
import { createDemoTransportBinding } from './demo-transport-binding';
import { defaultTripLocationTransport } from './default-trip-location-transport';
import { createFixedPointTransport } from './fixed-point-transport';
import {
  dispatchSharing,
  noteGoodReading,
  swapTripLocationTransport,
  useSharingStore,
} from './sharing-runtime';
import { describeFailure, onRejectedForGood, MAX_READING_ACCURACY_M } from './trip-location-ports';

const binding = createDemoTransportBinding({
  swap: swapTripLocationTransport,
  defaultTransport: defaultTripLocationTransport,
  createDemoTransport: (center) =>
    createFixedPointTransport({
      center,
      batchPorts: {
        now: Date.now,
        getStatus: () => useSharingStore.getState().machine.status,
        getIntervalSec: () => useSharingStore.getState().intervalSec,
        dispatch: dispatchSharing,
        noteGoodReading,
        report: reportDriverLocation,
        describeFailure,
        onRejectedForGood,
        maxAccuracyM: MAX_READING_ACCURACY_M,
      },
      isForeground: () => AppState.currentState === 'active',
      setTimer: (handler, ms) => setInterval(handler, ms),
      clearTimer: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
      now: Date.now,
    }),
});

binding.sync(useSessionStore.getState().user);
useSessionStore.subscribe((state) => binding.sync(state.user));
