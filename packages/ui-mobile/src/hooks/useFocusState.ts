import { useCallback, useState } from 'react';

export interface FocusState {
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}

export function useFocusState(): FocusState {
  const [focused, setFocused] = useState(false);
  const onFocus = useCallback(() => setFocused(true), []);
  const onBlur = useCallback(() => setFocused(false), []);
  return { focused, onFocus, onBlur };
}
