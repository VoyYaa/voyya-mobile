import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { applyOtpEntry } from './otp-entry.ts';

const LENGTH = 6;

describe('applyOtpEntry', () => {
  const table: ReadonlyArray<readonly [string, string, string, string]> = [
    ['six digits pasted into an empty field', '', '123456', '123456'],
    ['a pasted code with a space', '', '123 456', '123456'],
    ['a pasted code with a dash', '', '123-456', '123456'],
    ['a pasted message that carries the code', '', 'Tu código VoyYa es 123456', '123456'],
    ['five digits pasted into an empty field', '', '12345', '12345'],
    ['a code pasted over two typed digits', '12', '12123456', '123456'],
    ['a spaced code pasted over two typed digits', '12', '12123 456', '123456'],
    ['a code pasted over a full code', '123456', '123456654321', '654321'],
    ['one digit typed', '123', '1234', '1234'],
    ['the sixth digit typed', '12345', '123456', '123456'],
    ['one digit typed over a full code', '123456', '1234567', '123456'],
    ['one digit deleted', '123456', '12345', '12345'],
    ['everything deleted', '1', '', ''],
    ['letters typed', '12', '12ab', '12'],
    ['only symbols pasted', '', '--  --', ''],
    ['an arabic digit', '', '١٢٣', ''],
  ];

  for (const [name, previous, raw, expected] of table) {
    it(`handles ${name}`, () => {
      assert.equal(applyOtpEntry(previous, raw, LENGTH), expected);
    });
  }

  it('keeps the first digits when one extra digit is typed', () => {
    assert.equal(applyOtpEntry('1234', '12345', 4), '1234');
  });

  it('works with the four digits of the start code of the driver', () => {
    assert.equal(applyOtpEntry('', '1234', 4), '1234');
    assert.equal(applyOtpEntry('', '12 34', 4), '1234');
    assert.equal(applyOtpEntry('12', '1212345', 4), '2345');
  });

  it('never returns more digits than the length', () => {
    for (const raw of ['1'.repeat(40), '12'.repeat(30), '9']) {
      for (const previous of ['', '1', '123456']) {
        assert.ok(applyOtpEntry(previous, raw, LENGTH).length <= LENGTH);
      }
    }
  });
});
