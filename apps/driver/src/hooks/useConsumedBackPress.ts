import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

export function useConsumedBackPress(active: boolean, onConsumed: () => void): void {
  const onConsumedRef = useRef(onConsumed);
  onConsumedRef.current = onConsumed;

  useEffect(() => {
    if (!active) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onConsumedRef.current();
      return true;
    });
    return () => subscription.remove();
  }, [active]);
}
