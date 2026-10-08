import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { withAlpha } from './color.ts';

describe('withAlpha', () => {
  it('converts a hex color into rgba with the given alpha', () => {
    assert.equal(withAlpha('#F4A21A', 0.5), 'rgba(244, 162, 26, 0.5)');
  });

  it('accepts hex without the leading hash', () => {
    assert.equal(withAlpha('2A2018', 1), 'rgba(42, 32, 24, 1)');
  });
});
