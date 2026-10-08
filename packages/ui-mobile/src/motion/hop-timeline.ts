export const HOP = {
  restEnd: 120,
  anticipationEnd: 300,
  apex: 590,
  impact: 880,
  settled: 1300,
  returnStart: 1620,
  returnEnd: 1880,
  figureCycleEnd: 2000,
  neutralCycleEnd: 1500,
  morphInStart: 915,
  morphInMs: 250,
  morphOutStart: 1650,
  morphOutMs: 230,
} as const;

const SAMPLE_STEP_MS = 12;
const CENTER = 100;
const GROUND = 127;
const JUMP_HEIGHT = 60;
const HEAD_RISE = 24;
const GROUNDED_BAND = 0.1;

export interface Keyframes {
  inputRange: number[];
  outputRange: number[];
}

export interface HopTimelineOptions {
  size: number;
  figure: boolean;
  shadowSpread: number;
}

export interface HopKeyframes {
  endMs: number;
  settledMs: number;
  translateY: Keyframes;
  scaleX: Keyframes;
  scaleY: Keyframes;
  ringOpacity: Keyframes;
  ringScale: Keyframes;
  rippleOpacity: Keyframes;
  rippleScale: Keyframes;
  shadowOpacity: Keyframes;
  shadowScaleX: Keyframes;
  headScale: Keyframes;
  headTranslateY: Keyframes;
  wheelScaleFront: Keyframes;
  wheelScaleRear: Keyframes;
  windowOpacity: Keyframes;
}

type Knot = readonly [number, number];

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const progressIn = (t: number, start: number, duration: number): number =>
  clamp01((t - start) / duration);
const easeInOut = (x: number): number => 0.5 - 0.5 * Math.cos(Math.PI * x);
const easeIn = (x: number): number => x * x;
const easeOutCubic = (x: number): number => 1 - (1 - x) ** 3;
const easeOutBack = (x: number, overshoot: number): number => {
  const c = x - 1;
  return c * c * ((overshoot + 1) * c + overshoot) + 1;
};
const lerp = (from: number, to: number, x: number): number => from + (to - from) * x;

export function createMonotoneCurve(knots: readonly Knot[]): (t: number) => number {
  const count = knots.length;
  const xs = knots.map((knot) => knot[0]);
  const ys = knots.map((knot) => knot[1]);
  const secants: number[] = [];
  for (let k = 0; k < count - 1; k += 1) {
    secants.push(((ys[k + 1] ?? 0) - (ys[k] ?? 0)) / ((xs[k + 1] ?? 0) - (xs[k] ?? 0)));
  }
  const tangents: number[] = secants.length === 0 ? [0] : [secants[0] ?? 0];
  for (let k = 1; k < count - 1; k += 1) {
    const before = secants[k - 1] ?? 0;
    const after = secants[k] ?? 0;
    tangents.push(before * after <= 0 ? 0 : (before + after) / 2);
  }
  if (count > 1) tangents.push(secants[count - 2] ?? 0);
  for (let k = 0; k < count - 1; k += 1) {
    const secant = secants[k] ?? 0;
    if (secant === 0) {
      tangents[k] = 0;
      tangents[k + 1] = 0;
      continue;
    }
    const a = (tangents[k] ?? 0) / secant;
    const b = (tangents[k + 1] ?? 0) / secant;
    const radius = a * a + b * b;
    if (radius > 9) {
      const tau = 3 / Math.sqrt(radius);
      tangents[k] = tau * a * secant;
      tangents[k + 1] = tau * b * secant;
    }
  }

  return (t: number): number => {
    if (t <= (xs[0] ?? 0)) return ys[0] ?? 0;
    if (t >= (xs[count - 1] ?? 0)) return ys[count - 1] ?? 0;
    let k = 0;
    while (k < count - 2 && t > (xs[k + 1] ?? 0)) k += 1;
    const x0 = xs[k] ?? 0;
    const width = (xs[k + 1] ?? 0) - x0;
    const s = (t - x0) / width;
    const s2 = s * s;
    const s3 = s2 * s;
    return (
      (2 * s3 - 3 * s2 + 1) * (ys[k] ?? 0) +
      (s3 - 2 * s2 + s) * width * (tangents[k] ?? 0) +
      (-2 * s3 + 3 * s2) * (ys[k + 1] ?? 0) +
      (s3 - s2) * width * (tangents[k + 1] ?? 0)
    );
  };
}

function squashKnots(figure: boolean): readonly Knot[] {
  const airborne: Knot[] = [
    [0, 1],
    [HOP.restEnd, 1],
    [210, 0.86],
    [HOP.anticipationEnd, 0.8],
    [340, 1.14],
    [480, 1.05],
    [HOP.apex, 1.02],
    [740, 1.07],
    [HOP.impact, 1.14],
    [960, 0.7],
    [1080, 1.1],
    [1200, 0.97],
    [HOP.settled, 1],
  ];
  if (!figure) return [...airborne, [HOP.neutralCycleEnd, 1]];
  return [
    ...airborne,
    [HOP.returnStart, 1],
    [1700, 0.9],
    [HOP.returnEnd, 1],
    [HOP.figureCycleEnd, 1],
  ];
}

export function jumpHeight(t: number): number {
  if (t <= HOP.anticipationEnd || t >= HOP.impact) return 0;
  if (t <= HOP.apex) {
    const u = (t - HOP.anticipationEnd) / (HOP.apex - HOP.anticipationEnd);
    return 1 - (1 - u) ** 2;
  }
  const u = (t - HOP.apex) / (HOP.impact - HOP.apex);
  return 1 - u * u;
}

export function figureMix(t: number): number {
  if (t < HOP.returnStart) {
    return Math.max(0, easeOutBack(progressIn(t, HOP.morphInStart, HOP.morphInMs), 1.2));
  }
  return 1 - easeInOut(progressIn(t, HOP.morphOutStart, HOP.morphOutMs));
}

function sample(endMs: number, fn: (t: number) => number): Keyframes {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let t = 0; t < endMs; t += SAMPLE_STEP_MS) {
    inputRange.push(t);
    outputRange.push(Math.round(fn(t) * 1000) / 1000);
  }
  inputRange.push(endMs);
  outputRange.push(Math.round(fn(endMs) * 1000) / 1000);
  return { inputRange, outputRange };
}

function popScale(t: number, start: number, outStart: number, overshoot: number): number {
  if (t < outStart) return Math.max(0, easeOutBack(progressIn(t, start, 190), overshoot));
  return 1 - easeIn(progressIn(t, outStart, 110));
}

export function buildHopKeyframes(options: HopTimelineOptions): HopKeyframes {
  const { size, figure, shadowSpread } = options;
  const unit = size / 200;
  const endMs = figure ? HOP.figureCycleEnd : HOP.neutralCycleEnd;
  const settledMs = figure ? HOP.settled : HOP.neutralCycleEnd;
  const squash = createMonotoneCurve(squashKnots(figure));
  const ringBackStart = figure ? 1700 : HOP.settled;
  const ringBackEnd = figure ? HOP.returnEnd : HOP.neutralCycleEnd;

  const ringOpacity = (t: number): number => {
    if (t < ringBackStart) return 1 - easeInOut(progressIn(t, HOP.restEnd, 120));
    return easeInOut(progressIn(t, ringBackStart, ringBackEnd - ringBackStart));
  };
  const ringScale = (t: number): number => {
    if (t < ringBackStart) return lerp(1, 1.15, easeInOut(progressIn(t, HOP.restEnd, 120)));
    return lerp(0.8, 1, easeOutCubic(progressIn(t, ringBackStart, ringBackEnd - ringBackStart)));
  };
  const rippleProgress = (t: number): number => progressIn(t, HOP.impact, 340);
  const shadowMix = (t: number): number => (figure ? figureMix(t) : 0);

  return {
    endMs,
    settledMs,
    translateY: sample(endMs, (t) => {
      const height = jumpHeight(t);
      const grounded = clamp01(1 - height / GROUNDED_BAND);
      const pivot = lerp(CENTER, GROUND, grounded);
      return (-height * JUMP_HEIGHT + (pivot - CENTER) * (1 - squash(t))) * unit;
    }),
    scaleY: sample(endMs, squash),
    scaleX: sample(endMs, (t) => 1 / Math.sqrt(squash(t))),
    ringOpacity: sample(endMs, ringOpacity),
    ringScale: sample(endMs, ringScale),
    rippleOpacity: sample(endMs, (t) => {
      if (t < HOP.impact) return 0;
      return 0.6 * (1 - rippleProgress(t)) ** 1.5;
    }),
    rippleScale: sample(endMs, (t) => 0.45 + 1.1 * easeOutCubic(rippleProgress(t))),
    shadowOpacity: sample(endMs, (t) => 0.7 * (1 - 0.7 * jumpHeight(t))),
    shadowScaleX: sample(
      endMs,
      (t) => lerp(1, shadowSpread, shadowMix(t)) * (1 - 0.45 * jumpHeight(t)),
    ),
    headScale: sample(endMs, (t) => popScale(t, 940, HOP.returnStart, 2.2)),
    headTranslateY: sample(endMs, (t) => {
      const scale = clamp01(popScale(t, 940, HOP.returnStart, 2.2));
      return (1 - scale) * HEAD_RISE * unit;
    }),
    wheelScaleFront: sample(endMs, (t) => popScale(t, 990, HOP.returnStart + 15, 2.4)),
    wheelScaleRear: sample(endMs, (t) => popScale(t, 1015, HOP.returnStart, 2.4)),
    windowOpacity: sample(endMs, (t) => {
      if (t < HOP.returnStart) return progressIn(t, 1060, 120);
      return 1 - progressIn(t, HOP.returnStart, 80);
    }),
  };
}
