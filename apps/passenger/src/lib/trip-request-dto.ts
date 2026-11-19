import type { CreateTripRequestDTO, Location, PaymentMethod, QuoteResponse } from '@voyyaa/shared';
import type { ActivatableServiceType } from '@voyyaa/shared';
import { composeAddress } from './address';

export interface TripRequestInput {
  origin: Location;
  destination: Location;
  pickupReference: string;
  dropoffReference: string;
  municipalityId: number;
  serviceType: ActivatableServiceType;
  paymentMethod: PaymentMethod;
  quote: Pick<QuoteResponse, 'quote_token'>;
  requestedCompanyId: number | null | undefined;
}

export function toCreateTripRequestDTO(input: TripRequestInput): CreateTripRequestDTO {
  return {
    origin: {
      ...input.origin,
      address: composeAddress(input.origin.address, input.pickupReference),
    },
    destination: {
      ...input.destination,
      address: composeAddress(input.destination.address, input.dropoffReference),
    },
    municipality_id: input.municipalityId,
    service_type: input.serviceType,
    payment_method: input.paymentMethod,
    quote_token: input.quote.quote_token,
    requested_company_id: input.requestedCompanyId,
  };
}
