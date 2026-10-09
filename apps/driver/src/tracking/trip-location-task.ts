import * as TaskManager from 'expo-task-manager';
import type { LocationObject } from 'expo-location';
import { ApiError, LOCATION_REQUIRED_ACCURACY_M, domainErrorCode } from '@voyyaa/app-runtime';
import { reportDriverLocation } from '../api/driver.api';
import { useLocationIssueStore } from '../state/useLocationIssueStore';
import { TRIP_LOCATION_TASK } from './location-service';
import { pickReportableReading, type Reading } from './sharing-machine';
import { dispatchSharing, noteGoodReading } from './sharing-runtime';

interface TripLocationTaskData {
  locations: LocationObject[];
}

const HTTP_FORBIDDEN = 403;

function toReading(location: LocationObject): Reading {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    timestamp: location.timestamp,
  };
}

function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === HTTP_FORBIDDEN;
}

export async function reportBatch(locations: readonly LocationObject[]): Promise<void> {
  const now = Date.now();
  dispatchSharing({ type: 'tick', now });
  const reading = pickReportableReading(locations.map(toReading), LOCATION_REQUIRED_ACCURACY_M);
  if (reading === null) return;
  noteGoodReading(now);
  try {
    const result = await reportDriverLocation({ lat: reading.latitude, lng: reading.longitude });
    dispatchSharing({ type: 'report_result', sharing: result.location_sharing });
  } catch (error) {
    if (!isForbidden(error)) return;
    if (domainErrorCode(error) === 'LOCATION_CONSENT_REQUIRED') {
      useLocationIssueStore.getState().setIssue('consent_required');
    }
    dispatchSharing({ type: 'report_forbidden' });
  }
}

TaskManager.defineTask<TripLocationTaskData>(TRIP_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;
  await reportBatch(data.locations);
});
