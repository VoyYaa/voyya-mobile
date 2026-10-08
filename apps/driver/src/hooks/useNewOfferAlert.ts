import { useCallback, useEffect, useState } from 'react';
import type { AssignmentNotification } from '@voyyaa/shared';
import { findNewOffer } from '../offers/offer-rail';
import { useSeenOffersStore } from '../state/useSeenOffersStore';

export interface NewOfferAlert {
  offer: AssignmentNotification | null;
  dismiss: () => void;
}

export function useNewOfferAlert(
  offers: readonly AssignmentNotification[] | undefined,
): NewOfferAlert {
  const [alertedId, setAlertedId] = useState<number | null>(null);

  useEffect(() => {
    if (!offers) return;
    const { seenIds, markSeen } = useSeenOffersStore.getState();
    const fresh = findNewOffer(offers, new Set(seenIds));
    if (!fresh) return;
    markSeen(offers.map((offer) => offer.assignment_id));
    setAlertedId(fresh.assignment_id);
  }, [offers]);

  const dismiss = useCallback(() => setAlertedId(null), []);
  const offer = offers?.find((candidate) => candidate.assignment_id === alertedId) ?? null;

  return { offer, dismiss };
}
