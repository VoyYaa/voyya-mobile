import * as TaskManager from 'expo-task-manager';
import type { LocationObject } from 'expo-location';
import { reportDriverLocation } from '../api/driver.api';
import { TRIP_LOCATION_TASK } from './location-service';
import { reportBatch } from './report-batch';
import type { Reading } from './sharing-machine';
import {
  dispatchSharing,
  noteGoodReading,
  stopOrphanedTripLocation,
  useSharingStore,
} from './sharing-runtime';
import { MAX_READING_ACCURACY_M, describeFailure, onRejectedForGood } from './trip-location-ports';

interface TripLocationTaskData {
  locations: LocationObject[];
}

function toReading(location: LocationObject): Reading {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    timestamp: location.timestamp,
  };
}

function handleBatch(locations: readonly LocationObject[]): Promise<void> {
  return reportBatch(locations.map(toReading), {
    now: Date.now,
    getStatus: () => useSharingStore.getState().machine.status,
    getIntervalSec: () => useSharingStore.getState().intervalSec,
    dispatch: dispatchSharing,
    noteGoodReading,
    report: reportDriverLocation,
    describeFailure,
    onRejectedForGood,
    maxAccuracyM: MAX_READING_ACCURACY_M,
  });
}

stopOrphanedTripLocation();

TaskManager.defineTask<TripLocationTaskData>(TRIP_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;
  await handleBatch(data.locations);
});
