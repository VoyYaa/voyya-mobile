import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  COMPACT_RING_SIZE,
  RING_SIZE_MAX,
  RING_SIZE_MIN,
  requestStageLayout,
} from './request-stage-layout.ts';

describe('request stage layout', () => {
  it('caps the stage at 46 percent of the window', () => {
    const layout = requestStageLayout({ windowHeight: 800, topInset: 24, fixedHeight: 200 });
    assert.equal(layout.stageMaxHeight, 368);
  });

  it('sizes the ring from the free space of the stage, not from the window', () => {
    const tall = requestStageLayout({ windowHeight: 891, topInset: 24, fixedHeight: 170 });
    assert.equal(tall.freeHeight, 410 - 24 - 170);
    assert.equal(tall.ringSize, 216);
    assert.equal(tall.compact, false);
  });

  it('never exceeds the maximum ring size', () => {
    const layout = requestStageLayout({ windowHeight: 1400, topInset: 0, fixedHeight: 100 });
    assert.equal(layout.ringSize, RING_SIZE_MAX);
  });

  it('keeps the minimum ring size just above the compact threshold', () => {
    const layout = requestStageLayout({ windowHeight: 800, topInset: 24, fixedHeight: 248 });
    assert.equal(layout.freeHeight, 96 + 0);
    assert.equal(layout.compact, true);
    const edge = requestStageLayout({ windowHeight: 800, topInset: 24, fixedHeight: 224 });
    assert.equal(edge.freeHeight, 120);
    assert.equal(edge.compact, false);
    assert.equal(edge.ringSize, 120);
    assert.ok(edge.ringSize >= RING_SIZE_MIN);
  });

  it('goes compact on a short window or a large font', () => {
    const short = requestStageLayout({ windowHeight: 640, topInset: 24, fixedHeight: 230 });
    assert.equal(short.compact, true);
    assert.equal(short.ringSize, COMPACT_RING_SIZE);
    const largeFont = requestStageLayout({ windowHeight: 800, topInset: 24, fixedHeight: 340 });
    assert.equal(largeFont.compact, true);
  });

  it('survives degenerate inputs', () => {
    const layout = requestStageLayout({ windowHeight: 0, topInset: 50, fixedHeight: 500 });
    assert.equal(layout.freeHeight, 0);
    assert.equal(layout.compact, true);
  });
});
