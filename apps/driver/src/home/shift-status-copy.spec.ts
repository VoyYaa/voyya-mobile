import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

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
    const pendingCopy = [text.title, text.body, shiftSwitchHint({ consentPending: true })];
    for (const line of pendingCopy) {
      assert.ok(!/pausa|no estás recibiendo/i.test(line));
    }
    assert.ok(!text.body.includes('visible'));
    assert.ok(!text.title.includes('Esperando'));
    assert.ok(!shiftSwitchHint({ consentPending: true }).includes('Recibiendo'));
  });

  it('ignores a pending notice when off shift', () => {
    const text = shiftHeroText({ onShift: false, consentPending: true });
    assert.deepEqual(text, shiftHeroText({ onShift: false, consentPending: false }));
  });
});
