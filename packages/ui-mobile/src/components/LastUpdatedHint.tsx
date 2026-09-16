import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useTheme } from '../theme';

export interface LastUpdatedHintProps {
  updatedAtMs: number | null;
  isStale?: boolean;
}

export function LastUpdatedHint({
  updatedAtMs,
  isStale = false,
}: LastUpdatedHintProps): React.JSX.Element {
  const theme = useTheme();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (isStale) {
    return (
      <Text style={{ ...theme.typography.small, color: theme.colors.dangerInk }}>
        No pudimos actualizar · reintentando
      </Text>
    );
  }

  const elapsedSec =
    updatedAtMs !== null ? Math.max(0, Math.round((now - updatedAtMs) / 1000)) : null;

  return (
    <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
      {elapsedSec !== null ? `Actualizado hace ${elapsedSec}s` : ''}
    </Text>
  );
}
