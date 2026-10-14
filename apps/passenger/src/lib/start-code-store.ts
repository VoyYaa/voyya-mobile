import {
  START_CODE_KEY,
  nextStartCodeRecord,
  parseStartCodeRecord,
  serializeStartCodeRecord,
  type RecordProbe,
  type ServerStartCode,
  type StartCodeRecord,
} from './start-code-record';

export const INSTALL_MARKER_KEY = 'voyya_install_marker';

export interface StartCodeStoragePort {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string, options?: { thisDeviceOnly?: boolean }) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
}

export interface StartCodeRecordStore {
  ready: () => Promise<void>;
  getSnapshot: () => RecordProbe;
  subscribe: (listener: () => void) => () => void;
  sync: (server: ServerStartCode, userId: number) => Promise<void>;
  reconcile: (server: ServerStartCode | null, userId: number) => Promise<void>;
  clear: () => Promise<void>;
}

export interface StartCodeRecordStoreDeps {
  port: StartCodeStoragePort;
  now: () => number;
  companionKeys: readonly string[];
  refreshMs: number;
  readyTimeoutMs: number;
  installMarker: () => Promise<string | null>;
}

const DEVICE_ONLY = { thisDeviceOnly: true } as const;
const LOADING: RecordProbe = { kind: 'loading' };
const ABSENT: RecordProbe = { kind: 'absent' };

function ignoreFailure(): void {
  return undefined;
}

async function attempt<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch {
    return fallback;
  }
}

export function createStartCodeRecordStore(deps: StartCodeRecordStoreDeps): StartCodeRecordStore {
  const { port, now, companionKeys, refreshMs, readyTimeoutMs, installMarker } = deps;
  const allKeys = [START_CODE_KEY, ...companionKeys];
  const listeners = new Set<() => void>();

  let mirror: RecordProbe = LOADING;
  let decisions = 0;
  let clears = 0;
  let tail: Promise<void> = Promise.resolve();
  let readyPromise: Promise<void> | null = null;

  function publish(next: RecordProbe): void {
    mirror = next;
    [...listeners].forEach((listener) => listener());
  }

  function enqueue(operation: () => Promise<void>): Promise<void> {
    tail = tail.then(ready).then(operation);
    return tail;
  }

  function deleteAll(): Promise<void> {
    return Promise.all(allKeys.map((key) => attempt(() => port.deleteItem(key), undefined))).then(
      ignoreFailure,
    );
  }

  function purge(): Promise<void> {
    decisions += 1;
    clears += 1;
    if (mirror.kind !== 'absent') publish(ABSENT);
    return enqueue(deleteAll);
  }

  function write(record: StartCodeRecord): Promise<void> {
    decisions += 1;
    publish({ kind: 'present', record });
    return enqueue(() =>
      attempt(
        () => port.setItem(START_CODE_KEY, serializeStartCodeRecord(record), DEVICE_ONLY),
        undefined,
      ),
    );
  }

  function decide(
    server: ServerStartCode | null,
    userId: number,
    allowCreate: boolean,
  ): Promise<void> {
    decisions += 1;
    const cleanup = mirror.kind === 'invalid' ? purge() : Promise.resolve();
    const current = mirror.kind === 'present' ? mirror.record : null;
    const action = nextStartCodeRecord(current, server, {
      userId,
      now: now(),
      allowCreate,
      refreshMs,
    });
    if (action.kind === 'write') return write(action.record);
    if (action.kind === 'clear') return purge();
    return cleanup;
  }

  function whenLoaded(run: () => Promise<void>): Promise<void> {
    if (mirror.kind !== 'loading') return run();
    const clearsSeen = clears;
    return ready().then(() => (clears === clearsSeen ? run() : undefined));
  }

  async function wipeOnFreshInstall(): Promise<boolean> {
    let marker: string | null;
    try {
      marker = await installMarker();
    } catch {
      return true;
    }
    if (marker === null) return true;
    const known = await attempt(() => port.getItem(INSTALL_MARKER_KEY), null);
    if (known === marker) return true;
    const results = await Promise.allSettled(
      allKeys.map((key) => Promise.resolve().then(() => port.deleteItem(key))),
    );
    if (results.some((result) => result.status === 'rejected')) return false;
    await attempt(() => port.setItem(INSTALL_MARKER_KEY, marker, DEVICE_ONLY), undefined);
    return true;
  }

  function applyLoaded(next: RecordProbe): void {
    if (decisions === 0) publish(next);
  }

  async function initialize(): Promise<void> {
    if (!(await wipeOnFreshInstall())) {
      applyLoaded(ABSENT);
      return;
    }
    const raw = await attempt(() => port.getItem(START_CODE_KEY), null);
    applyLoaded(parseStartCodeRecord(raw));
  }

  function start(): Promise<void> {
    const chain = initialize();
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        if (mirror.kind === 'loading') publish(ABSENT);
        resolve();
      }, readyTimeoutMs);
      void chain.then(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  function ready(): Promise<void> {
    readyPromise ??= start();
    return readyPromise;
  }

  return {
    ready,
    getSnapshot: () => mirror,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    sync: (server, userId) => whenLoaded(() => decide(server, userId, true)),
    reconcile: (server, userId) => whenLoaded(() => decide(server, userId, false)),
    clear: purge,
  };
}
