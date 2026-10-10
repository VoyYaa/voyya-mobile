import * as TaskManager from 'expo-task-manager';
import type { LocationObject } from 'expo-location';
import { ApiError, LOCATION_REQUIRED_ACCURACY_M, domainErrorCode } from '@voyyaa/app-runtime';
import { reportDriverLocation } from '../api/driver.api';
import { useLocationIssueStore } from '../state/useLocationIssueStore';
import { TRIP_LOCATION_TASK } from './location-service';
import { reportBatch, type FailureInfo } from './report-batch';
import type { Reading } from './sharing-machine';
import {
  dispatchSharing,
  noteGoodReading,
  stopOrphanedTripLocation,
  useSharingStore,
} from './sharing-runtime';

interface TripLocationTaskData {
  locations: LocationObject[];
}

const CONSENT_REQUIRED = 'LOCATION_CONSENT_REQUIRED';

function toReading(location: LocationObject): Reading {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    timestamp: location.timestamp,
  };
}

function describeFailure(error: unknown): FailureInfo {
  const status = error instanceof ApiError ? error.status : undefined;
  return { status, code: domainErrorCode(error) };
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
    onRejectedForGood: ({ code }) => {
      if (code === CONSENT_REQUIRED) useLocationIssueStore.getState().setIssue('consent_required');
    },
    maxAccuracyM: LOCATION_REQUIRED_ACCURACY_M,
  });
}

stopOrphanedTripLocation();

TaskManager.defineTask<TripLocationTaskData>(TRIP_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;
  await handleBatch(data.locations);
});
