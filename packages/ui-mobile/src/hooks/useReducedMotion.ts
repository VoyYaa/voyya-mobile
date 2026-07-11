// =============================================================================
// VoyYa — useReducedMotion (packages/ui-mobile)
// -----------------------------------------------------------------------------
// Refleja `prefers-reduced-motion` del SO. Los componentes animados (Skeleton,
// radar de búsqueda, countdown) deben caer a un estado ESTÁTICO cuando es
// `true` — nunca "animación a medias" (pasajero-estados-borde.md §3.3).
// =============================================================================

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

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

  return reduced;
}
