import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, it } from 'node:test';
import type { ReportBatchPorts } from './report-batch.ts';
import { createFixedPointTransport, DEMO_READING_ACCURACY_M } from './fixed-point-transport.ts';
import {
  deriveSharingIndicator,
  type SharingEvent,
  type SharingStatus,
} from './sharing-machine.ts';

const CENTER = { lat: 10.25, lng: -20.5 };
const INTERVAL_SEC = 15;

interface FakeTimer {
  handler: () => void;
  ms: number;
  cleared: boolean;
}

describe('createFixedPointTransport', () => {
  let status: SharingStatus;
  let foreground: boolean;
  let reports: Array<{ lat: number; lng: number }>;
  let events: SharingEvent[];
  let goodReadings: number[];
  let timers: FakeTimer[];
  let clock: number;
  let batchPorts: ReportBatchPorts;

  function transport() {
    return createFixedPointTransport({
      center: CENTER,
      batchPorts,
      isForeground: () => foreground,
      setTimer: (handler, ms) => {
        const timer: FakeTimer = { handler, ms, cleared: false };
        timers.push(timer);
        return timer;
      },
      clearTimer: (handle) => {
        (handle as FakeTimer).cleared = true;
      },
      now: () => clock,
    });
  }

  async function settle(): Promise<void> {
    for (let turn = 0; turn < 4; turn += 1) await Promise.resolve();
  }

  beforeEach(() => {
    status = 'running';
    foreground = true;
    reports = [];
    events = [];
    goodReadings = [];
    timers = [];
    clock = 1_000_000;
    batchPorts = {
      now: () => clock,
      getStatus: () => status,
      getIntervalSec: () => INTERVAL_SEC,
      dispatch: (event) => events.push(event),
      noteGoodReading: (now) => goodReadings.push(now),
      report: async (coords) => {
        reports.push(coords);
        return { location_sharing: { trip_request_id: 4, interval_sec: INTERVAL_SEC } };
      },
      describeFailure: () => ({ status: undefined, code: undefined }),
      onRejectedForGood: () => undefined,
      maxAccuracyM: 100,
    };
  });

  it('reports the center at once and then every interval, and nothing else (CA-DX-19)', async () => {
    const fixed = transport();
    await fixed.start(INTERVAL_SEC);
    await settle();

    assert.deepEqual(reports, [CENTER]);
    assert.equal(timers.length, 1);
    assert.equal(timers[0]?.ms, INTERVAL_SEC * 1000);

    timers[0]?.handler();
    await settle();
    assert.deepEqual(reports, [CENTER, CENTER]);
  });

  it('notes every report as a good reading so the indicator never reads silence', async () => {
    const fixed = transport();
    await fixed.start(INTERVAL_SEC);
    await settle();
    assert.deepEqual(goodReadings, [clock]);
  });

  it('goes through the machine report path: the result is dispatched', async () => {
    const fixed = transport();
    await fixed.start(INTERVAL_SEC);
    await settle();
    assert.deepEqual(
      events.filter((event) => event.type === 'report_result'),
      [{ type: 'report_result', sharing: { trip_request_id: 4, interval_sec: INTERVAL_SEC } }],
    );
  });

  it('reports a reading the machine accepts as precise', () => {
    assert.ok(DEMO_READING_ACCURACY_M <= 100);
  });

  it('sends nothing while the app is in the background', async () => {
    foreground = false;
    const fixed = transport();
    await fixed.start(INTERVAL_SEC);
    timers[0]?.handler();
    await settle();
    assert.deepEqual(reports, []);
  });

  it('sends nothing when the machine is not running', async () => {
    status = 'idle';
    const fixed = transport();
    await fixed.start(INTERVAL_SEC);
    await settle();
    assert.deepEqual(reports, []);
  });

  it('stops the timer on stop and replaces it on a second start', async () => {
    const fixed = transport();
    await fixed.start(INTERVAL_SEC);
    await fixed.start(INTERVAL_SEC);
    assert.equal(timers[0]?.cleared, true);
    assert.equal(timers[1]?.cleared, false);
    await fixed.stop();
    assert.equal(timers[1]?.cleared, true);
  });

  it('stopping twice, or before starting, is harmless', async () => {
    const fixed = transport();
    await fixed.stop();
    await fixed.start(INTERVAL_SEC);
    await fixed.stop();
    await fixed.stop();
    assert.equal(timers[0]?.cleared, true);
  });

  it('declares a precise position and granted notifications, so no warning can appear (CA-DX-18)', async () => {
    const fixed = transport();
    assert.equal(await fixed.readAccuracy(), 'fine');
    assert.equal(await fixed.readNotificationsGranted(), true);
  });

  it('leaves the machine on the plain active indicator while it runs', () => {
    assert.deepEqual(
      deriveSharingIndicator({
        status: 'running',
        sharing: { trip_request_id: 4, interval_sec: INTERVAL_SEC },
        locationIssue: null,
        silentForSec: 1,
        offline: false,
      }),
      { kind: 'active' },
    );
  });
});

describe('the demo transport never touches the device (CA-DX-3)', () => {
  const sources = [
    'fixed-point-transport.ts',
    'demo-transport-binding.ts',
    'demo-transport-wiring.ts',
  ];

  for (const file of sources) {
    it(`${file} imports neither expo-location nor expo-notifications nor the task manager`, () => {
      const source = readFileSync(new URL(`./${file}`, import.meta.url), 'utf8');
      assert.doesNotMatch(source, /expo-location|expo-notifications|expo-task-manager/);
      assert.doesNotMatch(source, /location-service/);
    });
  }
});
