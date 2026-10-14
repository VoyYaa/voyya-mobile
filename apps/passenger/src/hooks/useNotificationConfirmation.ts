import { useEffect, useRef } from 'react';
import { usePushStore } from '@voyyaa/app-runtime';
import {
  BANNER_CONFIRMED_VISIBLE_MS,
  isPermissionInactive,
  shouldShowConfirmation,
} from '../lib/notifications-banner';
import { useNotificationsUiStore } from '../state/useNotificationsUiStore';

export function useNotificationConfirmation(): void {
  const permission = usePushStore((s) => s.permission);
  const registration = usePushStore((s) => s.registration);
  const setConfirmed = useNotificationsUiStore((s) => s.setConfirmed);
  const inactiveSeen = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    if (permission === 'unknown') inactiveSeen.current = false;
    if (isPermissionInactive(permission)) inactiveSeen.current = true;
    if (!shouldShowConfirmation(inactiveSeen.current, permission, registration)) return;
    inactiveSeen.current = false;
    setConfirmed(true);
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => setConfirmed(false), BANNER_CONFIRMED_VISIBLE_MS);
  }, [permission, registration, setConfirmed]);
}
