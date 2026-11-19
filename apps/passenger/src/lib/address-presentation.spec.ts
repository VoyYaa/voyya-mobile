import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pointTag, presentAddress, referenceView } from './address-presentation.ts';
import { toCreateTripRequestDTO } from './trip-request-dto.ts';

const PIN_ADDRESS = 'Punto marcado en el mapa';

describe('presentAddress', () => {
  it('reads a pin point as the point the passenger marked', () => {
    assert.equal(presentAddress(PIN_ADDRESS), 'Punto que marcaste en el mapa');
  });

  it('keeps a reference composed after the pin point', () => {
    assert.equal(
      presentAddress(`${PIN_ADDRESS} — portería azul`),
      'Punto que marcaste en el mapa — portería azul',
    );
  });

  it('leaves any other address untouched', () => {
    assert.equal(presentAddress('Tu ubicación actual'), 'Tu ubicación actual');
    assert.equal(presentAddress('Parque Principal'), 'Parque Principal');
  });

  it('never shows the old reading text as a value', () => {
    assert.doesNotMatch(presentAddress(PIN_ADDRESS), /Punto marcado en el mapa/);
  });
});

describe('pointTag', () => {
  it('tags a GPS origin', () => {
    assert.equal(pointTag('Tu ubicación actual', 'gps'), 'Por GPS');
  });

  it('tags a hand-marked pin', () => {
    assert.equal(pointTag(PIN_ADDRESS, 'manual'), 'Marcado a mano');
    assert.equal(pointTag(PIN_ADDRESS, null), 'Marcado a mano');
  });

  it('does not tag a known place', () => {
    assert.equal(pointTag('Parque Principal', 'manual'), null);
  });
});

describe('referenceView', () => {
  it('offers to add a reference when there is none', () => {
    assert.equal(referenceView('', false), 'add');
    assert.equal(referenceView('   ', false), 'add');
  });

  it('shows the reference with an edit action once written', () => {
    assert.equal(referenceView('portería', false), 'show');
  });

  it('shows the field while editing', () => {
    assert.equal(referenceView('', true), 'edit');
    assert.equal(referenceView('portería', true), 'edit');
  });
});

describe('toCreateTripRequestDTO', () => {
  const base = {
    origin: { address: PIN_ADDRESS, lat: 6.96, lng: -75.41 },
    destination: { address: 'Parque Principal', lat: 6.97, lng: -75.42 },
    pickupReference: '',
    dropoffReference: '',
    municipalityId: 3,
    serviceType: 'taxi' as const,
    paymentMethod: 'cash' as const,
    quote: { quote_token: 'token' },
    requestedCompanyId: null,
  };

  it('sends the pin address exactly as before, not the reading text', () => {
    const dto = toCreateTripRequestDTO(base);
    assert.equal(dto.origin.address, 'Punto marcado en el mapa');
    assert.equal(dto.destination.address, 'Parque Principal');
  });

  it('composes the reference after the address as before', () => {
    const dto = toCreateTripRequestDTO({
      ...base,
      pickupReference: ' portería azul ',
      dropoffReference: 'entrada',
    });
    assert.equal(dto.origin.address, 'Punto marcado en el mapa — portería azul');
    assert.equal(dto.destination.address, 'Parque Principal — entrada');
  });

  it('keeps the rest of the request', () => {
    const dto = toCreateTripRequestDTO(base);
    assert.equal(dto.municipality_id, 3);
    assert.equal(dto.service_type, 'taxi');
    assert.equal(dto.payment_method, 'cash');
    assert.equal(dto.quote_token, 'token');
    assert.equal(dto.requested_company_id, null);
    assert.equal(dto.origin.lat, 6.96);
  });
});
