import { Location } from '@voyyaa/shared';

export const PICKUP_ORIGIN_KEY = 'voyya_pickup_origin';

export interface PickupOriginStoragePort {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string, options?: { thisDeviceOnly?: boolean }) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
}

export interface PickupOriginStore {
  read: (tripRequestId: number) => Promise<Location | null>;
  save: (tripRequestId: number, origin: Location) => Promise<void>;
  clear: () => Promise<void>;
}

interface StoredPickup {
  trip_request_id: number;
  origin: Location;
}

function parseStored(raw: string | null): StoredPickup | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const { trip_request_id: tripRequestId, origin } = value as Partial<StoredPickup>;
    if (typeof tripRequestId !== 'number' || typeof origin !== 'object' || origin === null) {
      return null;
    }
    const parsed = Location.safeParse(origin);
    return parsed.success ? { trip_request_id: tripRequestId, origin: parsed.data } : null;
  } catch {
    return null;
  }
}

export function createPickupOriginStore(port: PickupOriginStoragePort): PickupOriginStore {
  return {
    async read(tripRequestId) {
      const stored = parseStored(await port.getItem(PICKUP_ORIGIN_KEY).catch(() => null));
      return stored !== null && stored.trip_request_id === tripRequestId ? stored.origin : null;
    },
    async save(tripRequestId, origin) {
      const value = JSON.stringify({ trip_request_id: tripRequestId, origin });
      await port.setItem(PICKUP_ORIGIN_KEY, value, { thisDeviceOnly: true }).catch(() => undefined);
    },
    clear: () => port.deleteItem(PICKUP_ORIGIN_KEY).catch(() => undefined),
  };
}
