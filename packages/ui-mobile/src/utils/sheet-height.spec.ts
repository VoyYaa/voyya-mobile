import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sheetMaxHeight } from './sheet-height.ts';

describe('sheetMaxHeight', () => {
  it('leaves room for the status bar and a margin above the sheet', () => {
    assert.equal(
      sheetMaxHeight({ windowHeight: 800, keyboardHeight: 0, statusBarHeight: 30 }),
      754,
    );
  });

  it('subtracts the keyboard so the title never goes under the status bar', () => {
    assert.equal(
      sheetMaxHeight({ windowHeight: 800, keyboardHeight: 300, statusBarHeight: 30 }),
      454,
    );
  });

  it('falls back to a default status bar height', () => {
    assert.equal(
      sheetMaxHeight({ windowHeight: 800, keyboardHeight: 0, statusBarHeight: null }),
      760,
    );
  });

  it('never returns a negative height', () => {
    assert.equal(
      sheetMaxHeight({ windowHeight: 100, keyboardHeight: 400, statusBarHeight: 30 }),
      0,
    );
  });
});
