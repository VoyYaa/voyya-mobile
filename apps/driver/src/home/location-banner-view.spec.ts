import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { issuesCopy } from '../copy/issues-copy.ts';
import { locationBannerView, type LocationBannerKind } from './location-banner-view.ts';

const KINDS: readonly LocationBannerKind[] = [
  'gps_disabled',
  'permission_denied',
  'consent_required',
  'precise_location_needed',
];

describe('location banner view', () => {
  it('words each banner with a title, a detail and an explicit action', () => {
    for (const kind of KINDS) {
      const view = locationBannerView(kind);
      assert.ok(view.title.length > 0);
      assert.ok(view.body.length > 0);
      assert.ok(view.action.length > 0);
    }
  });

  it('uses the final copy of the design', () => {
    assert.deepEqual(locationBannerView('gps_disabled'), {
      title: 'Ubicación apagada',
      body: 'Actívala para recibir solicitudes.',
      action: 'Abrir ajustes',
      tone: 'warning',
      icon: 'pin',
      urgent: true,
    });
    assert.equal(locationBannerView('permission_denied').title, 'Falta el permiso de ubicación');
    assert.equal(
      locationBannerView('permission_denied').body,
      'Sin él dejarás de recibir solicitudes.',
    );
    assert.equal(
      locationBannerView('consent_required').title,
      'Falta aceptar el aviso de ubicación',
    );
    assert.equal(locationBannerView('consent_required').body, issuesCopy.consentRequired);
    assert.equal(locationBannerView('consent_required').action, 'Leer y aceptar');
    assert.equal(
      locationBannerView('precise_location_needed').title,
      'Activa la ubicación precisa',
    );
    assert.equal(
      locationBannerView('precise_location_needed').body,
      'Así tu pasajero te ve en el mapa.',
    );
  });

  it('tells severities apart by icon shape and not only by tone', () => {
    const icons = new Set(KINDS.map((kind) => locationBannerView(kind).icon));
    assert.ok(icons.size >= 3);
  });

  it('marks blocking conditions as urgent and the rest as informative', () => {
    assert.equal(locationBannerView('permission_denied').urgent, true);
    assert.equal(locationBannerView('gps_disabled').urgent, true);
    assert.equal(locationBannerView('consent_required').urgent, false);
    assert.equal(locationBannerView('precise_location_needed').urgent, false);
  });

  it('never promises incoming requests while a trip is active', () => {
    for (const kind of KINDS) {
      const body = locationBannerView(kind, 'trip').body;
      assert.ok(!/solicitudes/.test(body), kind);
    }
  });

  it('explains the passenger reason in an active trip', () => {
    assert.equal(
      locationBannerView('gps_disabled', 'trip').body,
      'Actívala para que tu pasajero te vea en el mapa.',
    );
    assert.equal(
      locationBannerView('permission_denied', 'trip').body,
      'Sin él tu pasajero no te verá en el mapa.',
    );
    assert.equal(
      locationBannerView('consent_required', 'trip').body,
      'Sin aceptarlo no podemos compartir tu ubicación con tu pasajero.',
    );
  });

  it('keeps the shift copy by default and the same title, action and tone in a trip', () => {
    assert.equal(locationBannerView('gps_disabled').body, 'Actívala para recibir solicitudes.');
    const shift = locationBannerView('gps_disabled');
    const trip = locationBannerView('gps_disabled', 'trip');
    assert.equal(trip.title, shift.title);
    assert.equal(trip.action, shift.action);
    assert.equal(trip.tone, shift.tone);
  });
});
