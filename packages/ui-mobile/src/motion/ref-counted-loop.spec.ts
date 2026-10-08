import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createRefCountedLoop } from './ref-counted-loop.ts';

function createCounters(): {
  starts: () => number;
  stops: () => number;
  loop: ReturnType<typeof createRefCountedLoop>;
} {
  let starts = 0;
  let stops = 0;
  const loop = createRefCountedLoop(
    () => {
      starts += 1;
    },
    () => {
      stops += 1;
    },
  );
  return { starts: () => starts, stops: () => stops, loop };
}

describe('createRefCountedLoop', () => {
  it('starts a single loop for six simultaneous subscribers', () => {
    const { starts, stops, loop } = createCounters();
    const releases = Array.from({ length: 6 }, () => loop.acquire());

    assert.equal(starts(), 1);
    assert.equal(loop.activeCount(), 6);
    assert.equal(stops(), 0);

    releases.forEach((release) => release());
  });

  it('stops only when the last subscriber releases', () => {
    const { stops, loop } = createCounters();
    const releases = Array.from({ length: 3 }, () => loop.acquire());

    releases[0]?.();
    releases[1]?.();
    assert.equal(stops(), 0);

    releases[2]?.();
    assert.equal(stops(), 1);
    assert.equal(loop.activeCount(), 0);
  });

  it('ignores a release called twice', () => {
    const { stops, loop } = createCounters();
    const first = loop.acquire();
    const second = loop.acquire();

    first();
    first();
    assert.equal(loop.activeCount(), 1);
    assert.equal(stops(), 0);

    second();
    assert.equal(stops(), 1);
  });

  it('restarts after every subscriber left', () => {
    const { starts, loop } = createCounters();
    loop.acquire()();
    loop.acquire()();

    assert.equal(starts(), 2);
  });
});
