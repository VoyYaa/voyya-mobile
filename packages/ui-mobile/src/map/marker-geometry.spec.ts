import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  LABEL_GAP,
  LABEL_HEIGHT,
  estimateFitZoom,
  markerAnchorY,
  markerLabelText,
  selectLabeledMarkerIds,
  uniformInsets,
} from './marker-geometry.ts';
import type { MapMarker } from './types.ts';

const VIEWPORT = { width: 360, height: 192 };
const ORIGIN: MapMarker = { id: 'o', kind: 'origin', coord: { lat: 6.96, lng: -75.41 } };
const DESTINATION: MapMarker = { id: 'd', kind: 'destination', coord: { lat: 6.97, lng: -75.42 } };
const CAR: MapMarker = { id: 'c', kind: 'car', coord: { lat: 6.96, lng: -75.41 } };

describe('markerAnchorY', () => {
  it('anchors a destination on its tip and an origin on its center', () => {
    assert.equal(markerAnchorY('destination', false), 54 / 56);
    assert.equal(markerAnchorY('origin', false), 24 / 48);
  });

  it('keeps the same anchor point in dp when a label is added below', () => {
    const total = 56 + LABEL_GAP + LABEL_HEIGHT;
    assert.equal(markerAnchorY('destination', true) * total, 54);
  });
});

describe('markerLabelText', () => {
  it('names each kind of marker', () => {
    assert.equal(markerLabelText(ORIGIN), 'Recogida');
    assert.equal(markerLabelText(DESTINATION), 'Destino');
    assert.equal(markerLabelText(CAR), 'Tu conductor');
  });

  it('shows how long ago the signal came from when the driver is stale', () => {
    assert.equal(
      markerLabelText({ ...CAR, freshness: 'stale', ageLabel: 'Hace 1 min' }),
      'Hace 1 min',
    );
  });

  it('keeps the driver name when stale without an age', () => {
    assert.equal(markerLabelText({ ...CAR, freshness: 'stale' }), 'Tu conductor');
  });
});

describe('estimateFitZoom', () => {
  const range = { min: 12, max: 16 };
  const insets = uniformInsets(48);

  it('zooms out for far points and clamps to the minimum', () => {
    const zoom = estimateFitZoom(
      [
        { lat: 6.9, lng: -75.4 },
        { lat: 7.5, lng: -75.0 },
      ],
      VIEWPORT,
      insets,
      range,
    );
    assert.equal(zoom, 12);
  });

  it('clamps to the maximum for near points', () => {
    const zoom = estimateFitZoom(
      [
        { lat: 6.96, lng: -75.41 },
        { lat: 6.96001, lng: -75.41001 },
      ],
      VIEWPORT,
      insets,
      range,
    );
    assert.equal(zoom, 16);
  });

  it('returns the maximum for identical points', () => {
    const point = { lat: 6.96, lng: -75.41 };
    assert.equal(estimateFitZoom([point, point], VIEWPORT, insets, range), 16);
  });

  it('is lower for points that are farther apart', () => {
    const near = estimateFitZoom(
      [
        { lat: 6.96, lng: -75.41 },
        { lat: 6.962, lng: -75.41 },
      ],
      VIEWPORT,
      insets,
      range,
    );
    const far = estimateFitZoom(
      [
        { lat: 6.96, lng: -75.41 },
        { lat: 6.99, lng: -75.41 },
      ],
      VIEWPORT,
      insets,
      range,
    );
    assert.ok(far < near);
  });
});

describe('selectLabeledMarkerIds', () => {
  it('labels no marker in a map shorter than 140 dp', () => {
    const ids = selectLabeledMarkerIds([ORIGIN, DESTINATION], {
      viewport: { width: 360, height: 120 },
      zoom: 14,
    });
    assert.equal(ids.size, 0);
  });

  it('labels both markers when they are far apart on screen', () => {
    const ids = selectLabeledMarkerIds([ORIGIN, DESTINATION], { viewport: VIEWPORT, zoom: 14 });
    assert.deepEqual([...ids].sort(), ['d', 'o']);
  });

  it('keeps only the highest priority label when two markers overlap', () => {
    const ids = selectLabeledMarkerIds([ORIGIN, CAR], { viewport: VIEWPORT, zoom: 14 });
    assert.deepEqual([...ids], ['c']);
  });

  it('prefers the destination over the origin', () => {
    const closeDestination: MapMarker = { ...DESTINATION, coord: ORIGIN.coord };
    const ids = selectLabeledMarkerIds([ORIGIN, closeDestination], {
      viewport: VIEWPORT,
      zoom: 14,
    });
    assert.deepEqual([...ids], ['d']);
  });

  it('honors a marker that opts out of the label', () => {
    const ids = selectLabeledMarkerIds([{ ...ORIGIN, showLabel: false }, DESTINATION], {
      viewport: VIEWPORT,
      zoom: 14,
    });
    assert.deepEqual([...ids], ['d']);
  });
});
