import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CURVE_SEGMENTS,
  distanceMeters,
  haveMarkersMoved,
  isCollapsedBounds,
  routeMidpoint,
  toBounds,
  toCurvedRoute,
  toLatLng,
  toPosition,
} from './geo.ts';

describe('toBounds', () => {
  it('encloses every point, with the north east corner first', () => {
    const bounds = toBounds([
      { lat: 6.96, lng: -75.41 },
      { lat: 6.98, lng: -75.43 },
      { lat: 6.95, lng: -75.4 },
    ]);
    assert.deepEqual(bounds, { ne: [-75.4, 6.98], sw: [-75.43, 6.95] });
  });

  it('collapses to a single point', () => {
    const bounds = toBounds([{ lat: 6.96, lng: -75.41 }]);
    assert.deepEqual(bounds, { ne: [-75.41, 6.96], sw: [-75.41, 6.96] });
  });

  it('has no bounds without points', () => {
    assert.equal(toBounds([]), null);
  });
});

describe('position helpers', () => {
  it('swaps to longitude first and back', () => {
    assert.deepEqual(toPosition({ lat: 6.96, lng: -75.41 }), [-75.41, 6.96]);
    assert.deepEqual(toLatLng([-75.41, 6.96]), { lat: 6.96, lng: -75.41 });
    assert.equal(toLatLng([Number.NaN, 1]), null);
  });
});

describe('toBounds with repeated points', () => {
  it('collapses two identical points without dividing by zero', () => {
    const point = { lat: 6.96, lng: -75.41 };
    const bounds = toBounds([point, point]);
    assert.ok(bounds);
    assert.equal(isCollapsedBounds(bounds), true);
  });

  it('does not collapse distinct points', () => {
    const bounds = toBounds([
      { lat: 6.96, lng: -75.41 },
      { lat: 6.97, lng: -75.41 },
    ]);
    assert.ok(bounds);
    assert.equal(isCollapsedBounds(bounds), false);
  });
});

describe('toCurvedRoute', () => {
  const a = { lat: 6.96, lng: -75.41 };
  const b = { lat: 6.97, lng: -75.43 };

  it('returns segments + 1 points that start and end exactly on the given points', () => {
    const points = toCurvedRoute(a, b);
    assert.equal(points.length, CURVE_SEGMENTS + 1);
    assert.deepEqual(points[0], a);
    assert.deepEqual(points[points.length - 1], b);
  });

  it('honors a custom number of segments', () => {
    assert.equal(toCurvedRoute(a, b, { segments: 10 }).length, 11);
  });

  it('gives the same curve when the points are swapped, only traversed backwards', () => {
    const forward = toCurvedRoute(a, b);
    const backward = toCurvedRoute(b, a);
    assert.deepEqual([...backward].reverse(), forward);
  });

  it('bends away from the straight segment', () => {
    const points = toCurvedRoute(a, b);
    const middle = points[CURVE_SEGMENTS / 2];
    assert.ok(middle);
    const straightMiddle = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
    assert.ok(distanceMeters(middle, straightMiddle) > 100);
  });

  it('returns a straight line for points closer than 40 meters', () => {
    const near = { lat: 6.96, lng: -75.4101 };
    assert.deepEqual(toCurvedRoute(a, near), [a, near]);
  });

  it('returns a straight line for identical points', () => {
    assert.deepEqual(toCurvedRoute(a, a), [a, a]);
  });
});

describe('routeMidpoint', () => {
  it('is the middle point of a curve', () => {
    const points = toCurvedRoute({ lat: 6.96, lng: -75.41 }, { lat: 6.97, lng: -75.43 });
    assert.deepEqual(routeMidpoint(points), points[CURVE_SEGMENTS / 2]);
  });

  it('is the average of a straight line', () => {
    assert.deepEqual(
      routeMidpoint([
        { lat: 1, lng: 1 },
        { lat: 3, lng: 5 },
      ]),
      { lat: 2, lng: 3 },
    );
  });

  it('has no midpoint without points', () => {
    assert.equal(routeMidpoint([]), null);
  });
});

describe('distanceMeters', () => {
  it('measures roughly 111 km per degree of latitude', () => {
    const km = distanceMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 }) / 1000;
    assert.ok(Math.abs(km - 111.2) < 0.5);
  });
});

describe('haveMarkersMoved', () => {
  const base = [{ lat: 6.96, lng: -75.41 }];

  it('ignores movement under the threshold', () => {
    assert.equal(haveMarkersMoved(base, [{ lat: 6.96005, lng: -75.41 }]), false);
  });

  it('detects movement over the threshold', () => {
    assert.equal(haveMarkersMoved(base, [{ lat: 6.9604, lng: -75.41 }]), true);
  });

  it('detects a different number of markers', () => {
    assert.equal(haveMarkersMoved(base, [...base, { lat: 6.97, lng: -75.41 }]), true);
  });
});
