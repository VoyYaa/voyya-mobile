export function offerRailRatio(remainingSec: number, totalSec: number): number {
  if (totalSec <= 0) return 0;
  return Math.min(1, Math.max(0, remainingSec / totalSec));
}

export function isOfferUrgent(remainingSec: number, warnThresholdSec: number): boolean {
  return remainingSec <= warnThresholdSec;
}

export function findNewOffer<T extends { assignment_id: number }>(
  offers: readonly T[],
  seenIds: ReadonlySet<number>,
): T | null {
  return offers.find((offer) => !seenIds.has(offer.assignment_id)) ?? null;
}
