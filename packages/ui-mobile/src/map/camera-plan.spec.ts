import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  FIT_ORNAMENT_CLEARANCE_DP,
  FIT_SIDE_CLEARANCE_DP,
  FIT_TOP_CLEARANCE_DP,
  LABEL_BAND_DP,
} from './marker-geometry.ts';
import { fitMarkersChanged, planCamera, shouldFit } from './camera-plan.ts';
import type { MapMarker } from './types.ts';

const ORIGIN: MapMarker = { id: 'o', kind: 'origin', coord: { lat: 6.96, lng: -75.41 } };
const DESTINATION: MapMarker = { id: 'd', kind: 'destination', coord: { lat: 6.97, lng: -75.42 } };
const CENTER = { lat: 6.5, lng: -75.0 };
const BASE = {
  center: CENTER,
  zoomLevel: 15,
  pinDrop: false,
  viewport: { width: 360, height: 192 },
};
const SHORT = { width: 360, height: 120 };

describe('shouldFit', () => {
  it('fits by default with two or more markers', () => {
    assert.equal(shouldFit({ markers: [ORIGIN, DESTINATION], pinDrop: false }), true);
  });

  it('does not fit with a single marker', () => {
    assert.equal(shouldFit({ markers: [ORIGIN], pinDrop: false }), false);
  });

  it('does not fit a selection map by default', () => {
    assert.equal(shouldFit({ markers: [ORIGIN, DESTINATION], pinDrop: true }), false);
  });

  it('honors an explicit choice', () => {
    const markers = [ORIGIN, DESTINATION];
    assert.equal(shouldFit({ markers, pinDrop: false, fitToMarkers: false }), false);
    assert.equal(shouldFit({ markers, pinDrop: true, fitToMarkers: true }), true);
  });
});

describe('planCamera', () => {
  it('centers on the given center with a single marker', () => {
    const plan = planCamera({ ...BASE, markers: [ORIGIN] });
    assert.equal(plan.kind, 'center');
    if (plan.kind === 'center') assert.deepEqual(plan.center, CENTER);
  });

  it('fits two labeled markers clear of the pin head, the labels and the Mapbox ornaments', () => {
    const plan = planCamera({ ...BASE, markers: [ORIGIN, DESTINATION] });
    assert.equal(plan.kind, 'bounds');
    if (plan.kind === 'bounds') {
      assert.equal(plan.insets.top, FIT_TOP_CLEARANCE_DP);
      assert.equal(plan.insets.left, FIT_SIDE_CLEARANCE_DP);
      assert.ok(plan.insets.top >= 54);
      assert.equal(plan.insets.bottom, FIT_ORNAMENT_CLEARANCE_DP + 24 + 2 + 24);
      assert.ok(plan.zoom >= 12 && plan.zoom <= 16);
      assert.deepEqual(plan.zoomRange, { min: 12, max: 16 });
    }
  });

  it('adds the label band below custom insets', () => {
    const plan = planCamera({
      ...BASE,
      fitInsets: { top: 10, right: 20, bottom: 30, left: 40 },
      markers: [ORIGIN, DESTINATION],
    });
    assert.equal(plan.kind, 'bounds');
    if (plan.kind === 'bounds') assert.equal(plan.insets.bottom, 30 + LABEL_BAND_DP);
  });

  it('does not add the label band when the map is too short for labels', () => {
    const plan = planCamera({ ...BASE, viewport: SHORT, markers: [ORIGIN, DESTINATION] });
    assert.equal(plan.kind, 'bounds');
    if (plan.kind === 'bounds') assert.equal(plan.insets.bottom, 48);
  });

  it('uses custom insets', () => {
    const plan = planCamera({
      ...BASE,
      viewport: SHORT,
      fitInsets: { top: 10, right: 20, bottom: 30, left: 40 },
      markers: [ORIGIN, DESTINATION],
    });
    assert.equal(plan.kind, 'bounds');
    if (plan.kind === 'bounds') {
      assert.deepEqual(plan.insets, { top: 10, right: 20, bottom: 30, left: 40 });
    }
  });

  it('centers on the shared point when two markers are identical', () => {
    const twin: MapMarker = { ...DESTINATION, coord: ORIGIN.coord };
    const plan = planCamera({ ...BASE, markers: [ORIGIN, twin] });
    assert.equal(plan.kind, 'center');
    if (plan.kind === 'center') assert.deepEqual(plan.center, ORIGIN.coord);
  });
});

describe('fitMarkersChanged', () => {
  it('ignores a move under 25 meters', () => {
    const moved = { ...ORIGIN, coord: { lat: 6.96005, lng: -75.41 } };
    assert.equal(fitMarkersChanged([ORIGIN, DESTINATION], [moved, DESTINATION]), false);
  });

  it('detects a move over 25 meters', () => {
    const moved = { ...ORIGIN, coord: { lat: 6.9604, lng: -75.41 } };
    assert.equal(fitMarkersChanged([ORIGIN, DESTINATION], [moved, DESTINATION]), true);
  });

  it('detects a different set of markers', () => {
    assert.equal(fitMarkersChanged([ORIGIN], [ORIGIN, DESTINATION]), true);
    assert.equal(fitMarkersChanged([ORIGIN], [{ ...DESTINATION, coord: ORIGIN.coord }]), true);
  });
});
