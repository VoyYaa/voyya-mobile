import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { homeCopy } from '../copy/home-copy.ts';
import { issuesCopy } from '../copy/issues-copy.ts';
import { shiftHeroText, shiftSwitchHint } from './shift-status-copy.ts';

describe('shift status copy', () => {
  it('says the driver is visible only when the notice is accepted', () => {
    const text = shiftHeroText({ onShift: true, consentPending: false });
    assert.equal(text.body, 'Sigues visible para los pasajeros.');
    assert.equal(shiftSwitchHint({ consentPending: false }), 'Recibiendo solicitudes cercanas.');
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
      text.body,
      shiftSwitchHint({ consentPending: true }),
      homeCopy.emptyBodyConsentPending,
      issuesCopy.locationPermission,
      issuesCopy.consentRequired,
    ];
    for (const line of pendingCopy) {
      assert.ok(!/pausa|no estás recibiendo|volver a recibir|no te ofrecemos/i.test(line));
    }
    assert.ok(!text.body.includes('visible'));
    assert.ok(!text.title.includes('Esperando'));
    assert.ok(!shiftSwitchHint({ consentPending: true }).includes('Recibiendo'));
  });

  it('words the empty state without saying requests already stopped', () => {
    assert.equal(
      homeCopy.emptyBodyConsentPending,
      'Para seguir recibiendo solicitudes, acepta el aviso nuevo.',
    );
  });

  it('words the issue banners without saying requests already stopped', () => {
    assert.equal(
      issuesCopy.locationPermission,
      'Revisa el permiso de ubicación: pronto dejarás de recibir solicitudes.',
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
});
