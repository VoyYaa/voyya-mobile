import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { homeCopy } from '../copy/home-copy.ts';
import { issuesCopy } from '../copy/issues-copy.ts';
import { emptyOffersBody, shiftHeroText, shiftSwitchHint } from './shift-status-copy.ts';

describe('shift status copy', () => {
  it('says each fact once while waiting for requests', () => {
    const text = shiftHeroText({ onShift: true, consentPending: false });
    assert.equal(text.title, 'Esperando solicitudes');
    assert.equal(text.body, null);
    assert.equal(shiftSwitchHint({ consentPending: false }), null);
    assert.equal(homeCopy.emptyBody, 'Sigues visible para los pasajeros.');
  });

  it('tells the truth while the new notice is pending', () => {
    const text = shiftHeroText({ onShift: true, consentPending: true });
    assert.equal(text.title, 'Aviso nuevo pendiente');
    assert.equal(text.body, 'Pronto dejarás de recibir solicitudes: acepta el aviso nuevo.');
    assert.equal(
      shiftSwitchHint({ consentPending: true }),
      'Sin el aviso nuevo dejarás de recibir solicitudes.',
    );
    const pendingCopy = [
      text.title,
      text.body ?? '',
      shiftSwitchHint({ consentPending: true }) ?? '',
      homeCopy.emptyBodyConsentPending,
      issuesCopy.banner.permission_denied.body,
      issuesCopy.consentRequired,
    ];
    for (const line of pendingCopy) {
      assert.ok(!/pausa|no estás recibiendo|volver a recibir|no te ofrecemos/i.test(line));
    }
    assert.ok(!text.body?.includes('visible'));
    assert.ok(!text.title.includes('Esperando'));
    assert.ok(!shiftSwitchHint({ consentPending: true })?.includes('Recibiendo'));
  });

  it('words the empty state without saying requests already stopped', () => {
    assert.equal(
      homeCopy.emptyBodyConsentPending,
      'Para seguir recibiendo solicitudes, acepta el aviso nuevo.',
    );
  });

  it('words the issue banners without saying requests already stopped', () => {
    assert.equal(
      issuesCopy.banner.permission_denied.body,
      'Sin él dejarás de recibir solicitudes.',
    );
    assert.equal(
      issuesCopy.consentRequired,
      'Si no lo aceptas, pronto dejarás de recibir solicitudes.',
    );
  });

  it('ignores a pending notice when off shift', () => {
    const text = shiftHeroText({ onShift: false, consentPending: true });
    assert.deepEqual(text, shiftHeroText({ onShift: false, consentPending: false }));
  });

  it('does not claim visibility under a location banner', () => {
    assert.equal(emptyOffersBody({ consentPending: false, hasLocationIssue: true }), undefined);
    assert.equal(
      emptyOffersBody({ consentPending: false, hasLocationIssue: false }),
      'Sigues visible para los pasajeros.',
    );
    assert.equal(
      emptyOffersBody({ consentPending: true, hasLocationIssue: true }),
      homeCopy.emptyBodyConsentPending,
    );
  });
});

describe('emptyOffersBody in a demo session (CA-DX-20)', () => {
  it('explains where requests come from instead of promising visibility', () => {
    const body = emptyOffersBody({ consentPending: false, hasLocationIssue: false, demo: true });
    assert.match(body ?? '', /solo si alguien pide un taxi desde la app del pasajero/);
  });

  it('keeps the pending notice text first, because it is true in a demo session too', () => {
    assert.equal(
      emptyOffersBody({ consentPending: true, hasLocationIssue: false, demo: true }),
      homeCopy.emptyBodyConsentPending,
    );
  });

  it('changes nothing for a real session', () => {
    assert.equal(
      emptyOffersBody({ consentPending: false, hasLocationIssue: false }),
      homeCopy.emptyBody,
    );
    assert.equal(
      emptyOffersBody({ consentPending: false, hasLocationIssue: false, demo: false }),
      homeCopy.emptyBody,
    );
  });
});
