import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { USE_NATIVE_DRIVER } from '../tokens';
import { HOP } from './hop-timeline';

export interface HopCycleOptions {
  figure: boolean;
  loop: boolean;
  active: boolean;
  reduced: boolean;
  settledMs: number;
  onSettled?: () => void;
}

export interface HopCycle {
  clock: Animated.Value;
  morph: Animated.Value;
}

const HOLD_GUARD_MS = 30;
const morphInEasing = Easing.out(Easing.back(1.2));

export function useHopCycle({
  figure,
  loop,
  active,
  reduced,
  settledMs,
  onSettled,
}: HopCycleOptions): HopCycle {
  const clock = useRef(new Animated.Value(0)).current;
  const morph = useRef(new Animated.Value(0)).current;
  const loopRef = useRef(loop);
  loopRef.current = loop;
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
  const running = useRef<Animated.CompositeAnimation | null>(null);
  const holdStartedAt = useRef<number | null>(null);
  const settledNotified = useRef(false);
  const interruptHold = useRef<() => void>(() => undefined);

  const notifySettled = (): void => {
    if (settledNotified.current) return;
    settledNotified.current = true;
    onSettledRef.current?.();
  };

  useEffect(() => {
    if (!active) return;
    let disposed = false;

    const runClock = (from: number, to: number): Animated.CompositeAnimation =>
      Animated.timing(clock, {
        toValue: to,
        duration: to - from,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      });

    const play = (animation: Animated.CompositeAnimation, onComplete: () => void): void => {
      running.current = animation;
      animation.start(({ finished }) => {
        if (finished && !disposed) onComplete();
      });
    };

    const settle = (): void => {
      holdStartedAt.current = null;
      notifySettled();
    };

    const forward = (): void => {
      settledNotified.current = false;
      clock.setValue(0);
      morph.setValue(0);
      const steps: Animated.CompositeAnimation[] = [runClock(0, settledMs)];
      if (figure) {
        steps.push(
          Animated.sequence([
            Animated.delay(HOP.morphInStart),
            Animated.timing(morph, {
              toValue: 1,
              duration: HOP.morphInMs,
              easing: morphInEasing,
              useNativeDriver: false,
            }),
          ]),
        );
      }
      play(Animated.parallel(steps), () => {
        if (!loopRef.current) {
          settle();
          return;
        }
        if (figure) backward();
        else forward();
      });
    };

    const backward = (): void => {
      holdStartedAt.current = Date.now();
      play(
        Animated.parallel([
          runClock(HOP.settled, HOP.figureCycleEnd),
          Animated.sequence([
            Animated.delay(HOP.morphOutStart - HOP.settled),
            Animated.timing(morph, {
              toValue: 0,
              duration: HOP.morphOutMs,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: false,
            }),
          ]),
        ]),
        () => {
          holdStartedAt.current = null;
          forward();
        },
      );
    };

    interruptHold.current = () => {
      if (holdStartedAt.current === null) return;
      const elapsed = Date.now() - holdStartedAt.current;
      if (elapsed >= HOP.returnStart - HOP.settled - HOLD_GUARD_MS) return;
      running.current?.stop();
      clock.setValue(HOP.settled);
      morph.setValue(1);
      settle();
    };

    if (reduced) {
      clock.setValue(0);
      morph.setValue(0);
    } else {
      forward();
    }

    return () => {
      disposed = true;
      interruptHold.current = () => undefined;
      running.current?.stop();
      running.current = null;
      holdStartedAt.current = null;
    };
  }, [active, reduced, figure, settledMs, clock, morph]);

  useEffect(() => {
    if (!loop) interruptHold.current();
  }, [loop]);

  useEffect(() => {
    if (!active || !reduced || loop) return;
    clock.setValue(settledMs);
    morph.setValue(figure ? 1 : 0);
    notifySettled();
  }, [loop, active, reduced, figure, settledMs, clock, morph]);

  return { clock, morph };
}
