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
});
