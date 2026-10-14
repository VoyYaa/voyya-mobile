import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  OTP_BOX_GAP_FLOOR,
  OTP_BOX_GAP_MAX,
  OTP_BOX_HEIGHT,
  OTP_BOX_WIDTH_FLOOR,
  OTP_BOX_WIDTH_MAX,
  fitOtpBoxes,
  naturalOtpWidth,
} from './otp-layout.ts';

const SIDE_PADDING = 48;

const SIX_BOXES_BY_WINDOW: ReadonlyArray<readonly [number, number, number, number]> = [
  [280, 33, 6, 228],
  [300, 36, 6, 246],
  [320, 39, 7, 269],
  [340, 42, 7, 287],
  [352, 44, 7, 299],
  [360, 45, 8, 310],
  [375, 47, 8, 322],
  [393, 50, 8, 340],
  [411, 52, 9, 357],
  [430, 55, 9, 375],
  [434, 56, 10, 386],
  [480, 56, 10, 386],
];

describe('naturalOtpWidth', () => {
  it('is the width of the design as drawn, with the widest box and the widest gap', () => {
    assert.equal(naturalOtpWidth(6), 386);
    assert.equal(naturalOtpWidth(4), 254);
  });
});

describe('fitOtpBoxes with six boxes', () => {
  for (const [windowWidth, boxWidth, boxGap, totalWidth] of SIX_BOXES_BY_WINDOW) {
    it(`fits a ${windowWidth} dp window as ${boxWidth} dp boxes with ${boxGap} dp gaps`, () => {
      const layout = fitOtpBoxes(6, windowWidth - SIDE_PADDING);
      assert.deepEqual(layout, { boxWidth, boxGap, totalWidth });
    });
  }

  it('measures 45 dp boxes with 8 dp gaps at 360 dp and 39 dp boxes with 7 dp gaps at 320 dp', () => {
    assert.deepEqual(fitOtpBoxes(6, 312), { boxWidth: 45, boxGap: 8, totalWidth: 310 });
    assert.deepEqual(fitOtpBoxes(6, 272), { boxWidth: 39, boxGap: 7, totalWidth: 269 });
  });

  it('never overflows the available width, at any width a phone can have', () => {
    for (let available = 210; available <= 700; available += 1) {
      const { totalWidth } = fitOtpBoxes(6, available);
      assert.ok(totalWidth <= available, `${totalWidth} does not fit in ${available}`);
    }
  });

  it('never overflows with fractional widths either', () => {
    for (let available = 210; available <= 500; available += 0.37) {
      const { totalWidth } = fitOtpBoxes(6, available);
      assert.ok(totalWidth <= available, `${totalWidth} does not fit in ${available}`);
    }
  });

  it('never exceeds the widest box nor the widest gap', () => {
    const wide = fitOtpBoxes(6, 2000);
    assert.equal(wide.boxWidth, OTP_BOX_WIDTH_MAX);
    assert.equal(wide.boxGap, OTP_BOX_GAP_MAX);
  });
});

describe('fitOtpBoxes with four boxes (the start code of the driver)', () => {
  it('keeps 56 dp boxes with 10 dp gaps from 254 dp of available width on', () => {
    for (const available of [254, 255, 272, 300, 312, 386, 1000]) {
      assert.deepEqual(fitOtpBoxes(4, available), { boxWidth: 56, boxGap: 10, totalWidth: 254 });
    }
  });

  it('scales down uniformly instead of overflowing when it does not fit', () => {
    assert.deepEqual(fitOtpBoxes(4, 252), { boxWidth: 55, boxGap: 9, totalWidth: 247 });
    assert.deepEqual(fitOtpBoxes(4, 232), { boxWidth: 51, boxGap: 9, totalWidth: 231 });
  });

  it('never overflows the available width', () => {
    for (let available = 140; available <= 700; available += 1) {
      const { totalWidth } = fitOtpBoxes(4, available);
      assert.ok(totalWidth <= available, `${totalWidth} does not fit in ${available}`);
    }
  });
});

describe('fitOtpBoxes at the limits', () => {
  it('never goes below the floors, which only act below any supported width', () => {
    const tiny = fitOtpBoxes(6, 100);
    assert.equal(tiny.boxWidth, OTP_BOX_WIDTH_FLOOR);
    assert.equal(tiny.boxGap, OTP_BOX_GAP_FLOOR);
  });

  it('draws the natural design while the width is unknown', () => {
    for (const unknown of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.deepEqual(fitOtpBoxes(6, unknown), { boxWidth: 56, boxGap: 10, totalWidth: 386 });
    }
  });

  it('keeps the height of the box fixed, because only the width scales', () => {
    assert.equal(OTP_BOX_HEIGHT, 64);
  });
});
