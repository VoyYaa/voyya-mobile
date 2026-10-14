export const NOTIFICATIONS_PROMPT_KEY = 'voyya_notifications_prompt';

export interface NotificationsPromptStoragePort {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
}

export interface NotificationsPromptState {
  declineCount: number;
  offeredTripId: number | null;
}

export interface NotificationsPromptStore {
  read: () => Promise<NotificationsPromptState>;
  recordOffered: (tripRequestId: number) => Promise<void>;
  recordDeclined: () => Promise<void>;
  clear: () => Promise<void>;
}

const EMPTY: NotificationsPromptState = { declineCount: 0, offeredTripId: null };

function parse(raw: string | null): NotificationsPromptState {
  if (raw === null) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return EMPTY;
    const { declineCount, offeredTripId } = value as Record<string, unknown>;
    if (typeof declineCount !== 'number' || !Number.isInteger(declineCount) || declineCount < 0) {
      return EMPTY;
    }
    if (offeredTripId !== null && !Number.isInteger(offeredTripId)) return EMPTY;
    return { declineCount, offeredTripId: offeredTripId as number | null };
  } catch {
    return EMPTY;
  }
}

export function createNotificationsPromptStore(
  port: NotificationsPromptStoragePort,
): NotificationsPromptStore {
  const read = async (): Promise<NotificationsPromptState> =>
    parse(await port.getItem(NOTIFICATIONS_PROMPT_KEY).catch(() => null));

  const write = async (state: NotificationsPromptState): Promise<void> => {
    await port.setItem(NOTIFICATIONS_PROMPT_KEY, JSON.stringify(state)).catch(() => undefined);
  };

  return {
    read,
    async recordOffered(tripRequestId) {
      await write({ ...(await read()), offeredTripId: tripRequestId });
    },
    async recordDeclined() {
      const current = await read();
      await write({ ...current, declineCount: current.declineCount + 1 });
    },
    clear: () => port.deleteItem(NOTIFICATIONS_PROMPT_KEY).catch(() => undefined),
  };
}
