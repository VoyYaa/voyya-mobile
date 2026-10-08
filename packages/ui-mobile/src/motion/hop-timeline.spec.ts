import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { HOP, buildHopKeyframes, createMonotoneCurve, figureMix, jumpHeight } from './hop-timeline.ts';

function valueAt(frames: { inputRange: number[]; outputRange: number[] }, t: number): number {
  const index = frames.inputRange.findIndex((input) => input >= t);
  return frames.outputRange[index === -1 ? frames.outputRange.length - 1 : index] ?? Number.NaN;
}

describe('createMonotoneCurve', () => {
  it('passes through its knots and never overshoots them', () => {
    const curve = createMonotoneCurve([
      [0, 0],
      [100, 1],
      [200, 1],
      [300, 0.5],
    ]);
    assert.equal(curve(0), 0);
    assert.equal(curve(100), 1);
    assert.equal(curve(300), 0.5);
    for (let t = 0; t <= 300; t += 5) {
      const value = curve(t);
      assert.ok(value >= -1e-9 && value <= 1 + 1e-9, `overshoot at ${t}: ${value}`);
    }
  });
});

describe('jumpHeight', () => {
  it('is grounded before takeoff and after impact', () => {
    assert.equal(jumpHeight(0), 0);
    assert.equal(jumpHeight(HOP.anticipationEnd), 0);
    assert.equal(jumpHeight(HOP.impact), 0);
    assert.equal(jumpHeight(HOP.impact + 50), 0);
  });

  it('peaks at the apex and is symmetric around it', () => {
    assert.equal(jumpHeight(HOP.apex), 1);
    const span = HOP.apex - HOP.anticipationEnd;
    assert.ok(Math.abs(jumpHeight(HOP.apex - span / 2) - jumpHeight(HOP.apex + span / 2)) < 1e-9);
  });

  it('rises decelerating and falls accelerating', () => {
    const early = jumpHeight(HOP.anticipationEnd + 40) - jumpHeight(HOP.anticipationEnd);
    const late = jumpHeight(HOP.apex) - jumpHeight(HOP.apex - 40);
    assert.ok(early > late);
    const fallStart = jumpHeight(HOP.apex) - jumpHeight(HOP.apex + 40);
    const fallEnd = jumpHeight(HOP.impact - 40) - jumpHeight(HOP.impact);
    assert.ok(fallEnd > fallStart);
  });
});

describe('figureMix', () => {
  it('is the ball before impact, the figure while held, and the ball again at the end', () => {
    assert.equal(figureMix(0), 0);
    assert.equal(figureMix(HOP.impact), 0);
    assert.ok(Math.abs(figureMix(HOP.settled) - 1) < 1e-9);
    assert.ok(Math.abs(figureMix(HOP.returnStart - 1) - 1) < 1e-9);
    assert.equal(figureMix(HOP.figureCycleEnd), 0);
  });
});

describe('buildHopKeyframes', () => {
  const options = { size: 200, figure: true, shadowSpread: 1.7 };
  const frames = buildHopKeyframes(options);

  it('starts and ends the cycle on the resting ball so the loop is seamless', () => {
    for (const channel of [frames.translateY, frames.scaleX, frames.scaleY, frames.ringOpacity]) {
      assert.equal(channel.outputRange[0], channel.outputRange[channel.outputRange.length - 1]);
    }
    assert.equal(valueAt(frames.scaleY, 0), 1);
    assert.equal(valueAt(frames.translateY, 0), 0);
    assert.equal(valueAt(frames.ringOpacity, 0), 1);
    assert.equal(valueAt(frames.headScale, 0), 0);
  });

  it('squashes on impact in the same instant the figure starts forming', () => {
    const squashTime = 960;
    assert.ok(valueAt(frames.scaleY, squashTime) < 0.75);
    assert.ok(valueAt(frames.scaleX, squashTime) > 1.15);
    assert.ok(HOP.morphInStart >= HOP.impact && HOP.morphInStart - HOP.impact <= 60);
    assert.ok(valueAt(frames.rippleOpacity, HOP.impact + 40) > 0.4);
  });

  it('lifts the ball by the jump height at the apex', () => {
    assert.ok(valueAt(frames.translateY, HOP.apex) < -50);
  });

  it('pops head and wheels only after the impact', () => {
    assert.equal(valueAt(frames.headScale, HOP.impact), 0);
    assert.ok(valueAt(frames.headScale, 1200) > 0.9);
    assert.equal(valueAt(frames.wheelScaleFront, HOP.impact), 0);
    assert.ok(valueAt(frames.wheelScaleFront, 1200) > 0.9);
  });

  it('uses a shorter loop and no figure pieces in neutral mode', () => {
    const neutral = buildHopKeyframes({ size: 200, figure: false, shadowSpread: 1 });
    assert.equal(neutral.endMs, HOP.neutralCycleEnd);
    assert.equal(neutral.settledMs, HOP.neutralCycleEnd);
    assert.equal(valueAt(neutral.shadowScaleX, 1100), 1);
    assert.equal(valueAt(neutral.ringOpacity, HOP.neutralCycleEnd), 1);
  });

  it('scales translation with the rendered size', () => {
    const small = buildHopKeyframes({ size: 100, figure: true, shadowSpread: 1.7 });
    const big = valueAt(frames.translateY, HOP.apex);
    assert.ok(Math.abs(valueAt(small.translateY, HOP.apex) - big / 2) < 0.01);
  });
});
