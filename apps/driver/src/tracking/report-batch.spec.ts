import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
  dropStaleReadings,
  isRejectedForGood,
  reportBatch,
  type ReportBatchPorts,
} from './report-batch.ts';
import type { Reading, SharingEvent, SharingStatus } from './sharing-machine.ts';

const NOW = 1_000_000;
const INTERVAL_SEC = 15;

function reading(ageMs: number, accuracy: number | null = 10): Reading {
  return { latitude: 6.96, longitude: -75.41, accuracy, timestamp: NOW - ageMs };
}

describe('isRejectedForGood', () => {
  it('treats 401 and 403 as definitive', () => {
    assert.equal(isRejectedForGood({ status: 401, code: undefined }), true);
    assert.equal(isRejectedForGood({ status: 403, code: 'FORBIDDEN' }), true);
  });

  it('treats 409 NOT_ON_SHIFT as definitive', () => {
    assert.equal(isRejectedForGood({ status: 409, code: 'NOT_ON_SHIFT' }), true);
  });

  it('does not treat 409 with another code as definitive', () => {
    assert.equal(isRejectedForGood({ status: 409, code: 'SOMETHING_ELSE' }), false);
    assert.equal(isRejectedForGood({ status: 409, code: undefined }), false);
  });

  it('does not treat other failures as definitive', () => {
    assert.equal(isRejectedForGood({ status: 500, code: undefined }), false);
    assert.equal(isRejectedForGood({ status: undefined, code: undefined }), false);
  });
});

describe('dropStaleReadings', () => {
  it('keeps readings up to twice the interval and drops older ones', () => {
    const limitMs = 2 * INTERVAL_SEC * 1000;
    const kept = dropStaleReadings([reading(limitMs), reading(limitMs + 1)], NOW, INTERVAL_SEC);
    assert.equal(kept.length, 1);
    assert.equal(kept[0]?.timestamp, NOW - limitMs);
  });
});

describe('reportBatch', () => {
  let status: SharingStatus;
  let intervalSec: number | null;
  let events: SharingEvent[];
  let reports: { lat: number; lng: number }[];
  let rejections: number;
  let ports: ReportBatchPorts;

  beforeEach(() => {
    status = 'running';
    intervalSec = INTERVAL_SEC;
    events = [];
    reports = [];
    rejections = 0;
    ports = {
      now: () => NOW,
      getStatus: () => status,
      getIntervalSec: () => intervalSec,
      dispatch: (event) => events.push(event),
      noteGoodReading: () => undefined,
      report: async (coords) => {
        reports.push(coords);
        return { location_sharing: null };
      },
      describeFailure: () => ({ status: 403, code: undefined }),
      onRejectedForGood: () => {
        rejections += 1;
      },
      maxAccuracyM: 50,
    };
  });

  it('reports a fresh reading while running', async () => {
    await reportBatch([reading(1000)], ports);
    assert.equal(reports.length, 1);
    assert.deepEqual(events.at(-1), { type: 'report_result', sharing: null });
  });

  for (const idle of ['idle', 'capped', 'precise_needed', 'failed'] as const) {
    it(`does not report when the machine is ${idle}`, async () => {
      status = idle;
      await reportBatch([reading(1000)], ports);
      assert.equal(reports.length, 0);
    });
  }

  it('does not report without a known interval', async () => {
    intervalSec = null;
    await reportBatch([reading(1000)], ports);
    assert.equal(reports.length, 0);
  });

  it('does not report a reading older than twice the interval', async () => {
    await reportBatch([reading(2 * INTERVAL_SEC * 1000 + 1)], ports);
    assert.equal(reports.length, 0);
  });

  it('reports the fresh reading when the batch also has an old one', async () => {
    await reportBatch([reading(600_000), reading(2000)], ports);
    assert.equal(reports.length, 1);
  });

  it('stops sharing when the server rejects for good', async () => {
    ports.report = async () => {
      throw new Error('rejected');
    };
    await reportBatch([reading(1000)], ports);
    assert.equal(rejections, 1);
    assert.deepEqual(events.at(-1), { type: 'report_forbidden' });
  });

  it('keeps sharing on a transient failure', async () => {
    ports.report = async () => {
      throw new Error('offline');
    };
    ports.describeFailure = () => ({ status: 500, code: undefined });
    await reportBatch([reading(1000)], ports);
    assert.equal(rejections, 0);
    assert.ok(!events.some((event) => event.type === 'report_forbidden'));
  });
});
