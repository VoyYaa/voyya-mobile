import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

const ReducedMotionOverrideContext = createContext<boolean | null>(null);

export interface ReducedMotionProviderProps {
  value: boolean;
  children: React.ReactNode;
}

export function ReducedMotionProvider({
  value,
  children,
}: ReducedMotionProviderProps): React.ReactElement {
  return React.createElement(ReducedMotionOverrideContext.Provider, { value }, children);
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  const override = useContext(ReducedMotionOverrideContext);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return override ?? reduced;
}
