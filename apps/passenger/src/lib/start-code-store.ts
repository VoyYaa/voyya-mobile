export const START_CODE_KEY = 'voyya_start_code';
export const INSTALL_MARKER_KEY = 'voyya_install_marker';

export interface StartCodeStoragePort {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string, options?: { thisDeviceOnly?: boolean }) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
}

export interface StartCodeSource {
  start_code: string | null;
  start_code_state: string;
}

export interface StartCodeStore {
  read: (tripRequestId: number) => Promise<string | null>;
  save: (tripRequestId: number, code: string) => Promise<void>;
  clear: () => Promise<void>;
  sync: (tripRequestId: number, source: StartCodeSource) => Promise<void>;
  wipeOnFreshInstall: (installMarker: string) => Promise<boolean>;
}

const CODE_PATTERN = /^[0-9]{4}$/;

interface StoredStartCode {
  trip_request_id: number;
  start_code: string;
}

function parseStored(raw: string | null): StoredStartCode | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const { trip_request_id: tripRequestId, start_code: code } = value as Partial<StoredStartCode>;
    if (typeof tripRequestId !== 'number' || typeof code !== 'string') return null;
    return CODE_PATTERN.test(code) ? { trip_request_id: tripRequestId, start_code: code } : null;
  } catch {
    return null;
  }
}

export function createStartCodeStore(port: StartCodeStoragePort): StartCodeStore {
  const clear = (): Promise<void> => port.deleteItem(START_CODE_KEY).catch(() => undefined);

  return {
    async read(tripRequestId) {
      const stored = parseStored(await port.getItem(START_CODE_KEY).catch(() => null));
      return stored !== null && stored.trip_request_id === tripRequestId ? stored.start_code : null;
    },
    async save(tripRequestId, code) {
      if (!CODE_PATTERN.test(code)) return;
      const value = JSON.stringify({ trip_request_id: tripRequestId, start_code: code });
      await port.setItem(START_CODE_KEY, value, { thisDeviceOnly: true }).catch(() => undefined);
    },
    clear,
    async sync(tripRequestId, source) {
      if (source.start_code_state === 'active' && source.start_code !== null) {
        await this.save(tripRequestId, source.start_code);
        return;
      }
      await clear();
    },
    async wipeOnFreshInstall(installMarker) {
      const known = await port.getItem(INSTALL_MARKER_KEY).catch(() => null);
      if (known === installMarker) return false;
      await clear();
      await port
        .setItem(INSTALL_MARKER_KEY, installMarker, { thisDeviceOnly: true })
        .catch(() => undefined);
      return true;
    },
  };
}
