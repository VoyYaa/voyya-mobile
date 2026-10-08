import {
  ActiveTripResponse,
  CancelTripRequestDTO,
  CreateTripRequestDTO,
  QuoteFareDTO,
  QuoteResponse,
  TripRequestCancelled,
  TripRequestCreated,
  TripRequestStatus,
  TripServiceOptionsResponse,
} from '@voyyaa/shared';
import { apiRequest } from '@voyyaa/app-runtime';

export function quoteFare(dto: QuoteFareDTO): Promise<QuoteResponse> {
  const body = QuoteFareDTO.parse(dto);
  return apiRequest({ method: 'POST', path: '/trips/quote', body }, QuoteResponse);
}

export function createTripRequest(dto: CreateTripRequestDTO): Promise<TripRequestCreated> {
  const body = CreateTripRequestDTO.parse(dto);
  return apiRequest({ method: 'POST', path: '/trips', body }, TripRequestCreated);
}

export function getTripRequestStatus(tripRequestId: number): Promise<TripRequestStatus> {
  return apiRequest({ method: 'GET', path: `/trips/${tripRequestId}` }, TripRequestStatus);
}

export function cancelTripRequest(
  tripRequestId: number,
  dto: CancelTripRequestDTO = {},
): Promise<TripRequestCancelled> {
  const body = CancelTripRequestDTO.parse(dto);
  return apiRequest(
    { method: 'POST', path: `/trips/${tripRequestId}/cancel`, body },
    TripRequestCancelled,
  );
}

export function getActiveTrip(): Promise<ActiveTripResponse> {
  return apiRequest({ method: 'GET', path: '/trips/active' }, ActiveTripResponse);
}

export function getServiceOptions(coordinate: {
  lat: number;
  lng: number;
}): Promise<TripServiceOptionsResponse> {
  const query = `lat=${coordinate.lat}&lng=${coordinate.lng}`;
  return apiRequest(
    { method: 'GET', path: `/trips/service-options?${query}` },
    TripServiceOptionsResponse,
  );
}
