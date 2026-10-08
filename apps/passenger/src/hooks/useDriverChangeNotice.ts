import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { AssignedDriverSummary } from '@voyyaa/shared';
import { driverChanged, driverIdentity } from '../lib/driver-change';
import { passengerCopy } from '../copy/passenger-copy';
import { useTripDraftStore } from '../state/useTripDraftStore';

export interface DriverChangeNotice {
  message: string | null;
  dismiss: () => void;
}

export function useDriverChangeNotice(
  tripRequestId: number | null,
  driver: AssignedDriverSummary | null,
): DriverChangeNotice {
  const lastAssignedDriver = useTripDraftStore((s) => s.lastAssignedDriver);
  const setLastAssignedDriver = useTripDraftStore((s) => s.setLastAssignedDriver);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (tripRequestId === null || driver === null) return;
    const current = driverIdentity(driver);
    const previous =
      lastAssignedDriver?.tripRequestId === tripRequestId ? lastAssignedDriver.identity : null;
    if (driverChanged(previous, current)) {
      const text = passengerCopy.trip.driverChanged(driver.name, driver.company.display_name);
      setMessage(text);
      AccessibilityInfo.announceForAccessibility(text);
    }
    if (previous === null || driverChanged(previous, current)) {
      setLastAssignedDriver({ tripRequestId, identity: current });
    }
  }, [
    tripRequestId,
    driver?.name,
    driver?.plate,
    driver?.company.company_id,
    lastAssignedDriver,
    setLastAssignedDriver,
  ]);

  return { message, dismiss: () => setMessage(null) };
}
