import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { notificationsCopy } from './notifications-copy.ts';

const source = readFileSync(new URL('./passenger-copy.ts', import.meta.url), 'utf8');

describe('search copy does not claim what the system does not know (X-1)', () => {
  it('says no taxi was found, not that every driver is busy', () => {
    assert.ok(
      source.includes(
        "noDriverBody: 'No encontramos un taxi disponible por ahora. Intenta de nuevo en unos minutos.'",
      ),
    );
    assert.equal(source.includes('Todos los conductores cercanos están ocupados'), false);
  });

  it('keeps the title of the no-taxi panel as it was', () => {
    assert.ok(source.includes("noDriverTitle: 'No hay taxis disponibles ahora'"));
  });
});

describe('permission sheet explains the identifier without naming processors (PP-02)', () => {
  const sheetTexts = Object.values(notificationsCopy.sheet);

  it('carries the neutral line about the identifier of the phone, in one centralized text', () => {
    assert.equal(
      notificationsCopy.sheet.dataNote,
      'Para enviarte los avisos guardamos un identificador de este teléfono. Lo explicamos en la política.',
    );
  });

  it('says what is kept and where to read more, in plain words', () => {
    assert.match(notificationsCopy.sheet.dataNote, /identificador de este teléfono/);
    assert.match(notificationsCopy.sheet.dataNote, /política/);
  });

  it('names no provider, because the final text is fixed by the legal opinion', () => {
    for (const text of sheetTexts) {
      assert.doesNotMatch(text, /expo|google|apple|firebase|fcm|apns/i, text);
    }
  });

  it('promises neither delivery nor deletion anywhere in the sheet', () => {
    for (const text of sheetTexts) {
      assert.doesNotMatch(text, /siempre|garantiz|borramos|eliminamos|no te perder/i, text);
    }
  });

  it('keeps the honest limit about delivery next to the benefit', () => {
    assert.match(notificationsCopy.sheet.note, /pueden tardar o no llegar/);
  });
});
