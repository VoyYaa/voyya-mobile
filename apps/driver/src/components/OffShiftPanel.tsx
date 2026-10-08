import React from 'react';
import { EmptyState } from '@voyyaa/ui-mobile';
import { driverCopy } from '../copy/driver-copy';

export interface OffShiftPanelProps {
  onActivate?: () => void;
}

export function OffShiftPanel({ onActivate }: OffShiftPanelProps): React.JSX.Element {
  return (
    <EmptyState
      glyph="empty"
      title={driverCopy.home.offShiftTitle}
      body={driverCopy.home.offShiftBody}
      primaryAction={
        onActivate ? { label: driverCopy.home.activateShift, onPress: onActivate } : undefined
      }
    />
  );
}
