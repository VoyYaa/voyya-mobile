import { DriverPushData } from '@voyyaa/shared';

export interface OfferNotificationTarget {
  pathname: '/requests/[id]';
  params: { id: string };
}

export function resolveDriverNotificationTarget(rawData: unknown): OfferNotificationTarget | null {
  const parsed = DriverPushData.safeParse(rawData);
  if (!parsed.success) return null;

  switch (parsed.data.type) {
    case 'assignment_offer':
      return {
        pathname: '/requests/[id]',
        params: { id: String(parsed.data.assignment_id) },
      };
    default: {
      const exhaustive: never = parsed.data.type;
      return exhaustive;
    }
  }
}
