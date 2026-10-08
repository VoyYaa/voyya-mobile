import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatLongDate } from './format-date.ts';

describe('formatLongDate', () => {
  it('formats in es-CO using the Bogota day', () => {
    assert.equal(formatLongDate('2026-10-09T03:00:00.000Z'), '8 de octubre de 2026');
  });

  it('returns null for missing or invalid input', () => {
    assert.equal(formatLongDate(null), null);
    assert.equal(formatLongDate('not-a-date'), null);
  });
});
