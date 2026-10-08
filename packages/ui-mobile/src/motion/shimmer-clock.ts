import { Animated, Easing } from 'react-native';
import { USE_NATIVE_DRIVER } from '../tokens';
import { createRefCountedLoop } from './ref-counted-loop';

export const SHIMMER_PERIOD_MS = 1400;

export const shimmerClock = new Animated.Value(0);

let running: Animated.CompositeAnimation | null = null;

const sharedLoop = createRefCountedLoop(
  () => {
    shimmerClock.setValue(0);
    running = Animated.loop(
      Animated.timing(shimmerClock, {
        toValue: 1,
        duration: SHIMMER_PERIOD_MS,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    );
    running.start();
  },
  () => {
    running?.stop();
    running = null;
  },
);

export const acquireShimmerClock = sharedLoop.acquire;

export function activeShimmerSubscribers(): number {
  return sharedLoop.activeCount();
}
