import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  BRAND_BALL_PATH,
  BRAND_FIGURE_BODY,
  BRAND_FIGURE_SHADOW_SPREAD,
  BRAND_GROUND_Y,
  BRAND_ICON_VIEWBOX,
  iconViewBox,
  type BrandFigure,
} from './brand-geometry.ts';

const countOf = (path: string, command: string): number =>
  path.split('').filter((char) => char === command).length;
const numbersOf = (path: string): number[] => (path.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);

describe('figure body paths', () => {
  const figures: BrandFigure[] = ['taxi', 'wheel'];

  it('only the two final figures exist', () => {
    assert.deepEqual(Object.keys(BRAND_FIGURE_BODY).sort(), ['taxi', 'wheel']);
    assert.deepEqual(Object.keys(BRAND_FIGURE_SHADOW_SPREAD).sort(), ['taxi', 'wheel']);
  });

  for (const figure of figures) {
    it(`${figure} has the same command structure as the ball so the path interpolates`, () => {
      const path = BRAND_FIGURE_BODY[figure];
      assert.equal(countOf(path, 'M'), 1);
      assert.equal(countOf(path, 'C'), 8);
      assert.equal(countOf(path, 'Z'), 1);
      assert.equal(numbersOf(path).length, 50);
      assert.equal(numbersOf(path).length, numbersOf(BRAND_BALL_PATH).length);
      assert.equal(countOf(path, 'L'), 0);
    });

    it(`${figure} rests on the ground line of the ball`, () => {
      const ys = numbersOf(BRAND_FIGURE_BODY[figure]).filter((_, index) => index % 2 === 1);
      assert.equal(Math.max(...ys), BRAND_GROUND_Y);
    });
  }

  it('the wheel body is a circle of radius 60 around (100, 67)', () => {
    const points = numbersOf(BRAND_FIGURE_BODY.wheel);
    const anchors: { x: number; y: number }[] = [{ x: points[0] ?? 0, y: points[1] ?? 0 }];
    for (let segment = 0; segment < 8; segment += 1) {
      anchors.push({ x: points[2 + segment * 6 + 4] ?? 0, y: points[2 + segment * 6 + 5] ?? 0 });
    }
    assert.equal(anchors.length, 9);
    for (const { x, y } of anchors) {
      assert.ok(Math.abs(Math.hypot(x - 100, y - 67) - 60) < 0.01);
    }
  });
});

describe('iconViewBox', () => {
  it('maps the anchor of the icon onto its canvas point at the given scale', () => {
    const { x, y, width, height } = iconViewBox({
      scale: 0.24,
      iconX: 512,
      iconY: 730,
      canvasX: 100,
      canvasY: 127,
    });
    const canvasOf = (px: number, py: number): { x: number; y: number } => ({
      x: ((px - x) / width) * 200,
      y: ((py - y) / height) * 200,
    });
    assert.ok(Math.abs(canvasOf(512, 730).x - 100) < 1e-9);
    assert.ok(Math.abs(canvasOf(512, 730).y - 127) < 1e-9);
    assert.ok(Math.abs(canvasOf(512 + 100, 730).x - (100 + 100 * 0.24)) < 1e-9);
  });

  it('taxi icon is drawn at 0.24 and the wheel at 3/14 of the canvas', () => {
    assert.ok(Math.abs(480 * 0.24 - 115.2) < 1e-9);
    assert.ok(Math.abs(BRAND_ICON_VIEWBOX.taxi.width - 200 / 0.24) < 1e-9);
    assert.ok(Math.abs(BRAND_ICON_VIEWBOX.wheel.width - (200 * 14) / 3) < 1e-9);
  });
});
