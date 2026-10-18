import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

const activeTrip = source('./useActiveTrip.ts');
const startup = source('./useActiveTripStartup.ts');
const persistence = source('./useStartCodePersistence.ts');
const reconciler = source('./useStartCodeReconciler.ts');
const pickup = source('./usePickupOriginPersistence.ts');
const cancel = source('./useCancelTripRequest.ts');
const routing = source('./usePassengerNotificationRouting.ts');
const screen = source('../../app/driver-assigned.tsx');
const home = source('../../app/index.tsx');
const tripStatusQuery = source('./useTripRequestStatus.ts');
const consentGate = source('./useLocationConsentGate.ts');
const httpClient = source('../../../../packages/app-runtime/src/api/http-client.ts');
const layout = source('../../app/_layout.tsx');
const startCodeRuntime = source('../lib/start-code-runtime.ts');
const pickupRuntime = source('../lib/pickup-origin-runtime.ts');

describe('R-2: the trip queries do not survive the session', () => {
  it('scopes both trip prefixes and the consent prefix to the session (CS-14)', () => {
    assert.match(
      activeTrip,
      /SESSION_SCOPED_QUERY_PREFIXES = \[\s*TRIP_REQUEST_QUERY_PREFIX,\s*ACTIVE_TRIP_QUERY_PREFIX,\s*CONSENT_QUERY_PREFIX,?\s*\] as const/,
    );
    assert.match(activeTrip, /TRIP_REQUEST_QUERY_PREFIX = \['tripRequest'\] as const/);
    assert.match(activeTrip, /ACTIVE_TRIP_QUERY_PREFIX = \['trips', 'active'\] as const/);
    assert.match(activeTrip, /CONSENT_QUERY_PREFIX[\s\S]*from '@voyyaa\/app-runtime'/);
  });

  it('keeps the consent query of the runtime under that same prefix', () => {
    const runtimeConsent = source(
      '../../../../packages/app-runtime/src/consent/useLocationConsent.ts',
    );
    assert.match(runtimeConsent, /CONSENT_QUERY_PREFIX = \['consents'\] as const/);
    assert.match(
      runtimeConsent,
      /LOCATION_CONSENT_QUERY_KEY = \[\.\.\.CONSENT_QUERY_PREFIX, 'location'\] as const/,
    );
  });

  it('cancels and removes every query of the session scope', () => {
    assert.match(activeTrip, /cancelQueries\(\{ queryKey \}\)/);
    assert.match(activeTrip, /removeQueries\(\{ queryKey \}\)/);
  });

  it('purges when the session ends or the user changes, from the root startup hook', () => {
    assert.match(startup, /shouldPurgeSessionQueries\(previousScope\.current, scope\)/);
    assert.match(startup, /purgeSessionScopedQueries\(queryClient\)/);
    assert.match(startup, /\[authenticated, userId\]/);
  });
});

describe('R-3: only the responses of this session are painted or written', () => {
  it('gates the screen sync on the session freshness', () => {
    assert.match(persistence, /isSessionFresh\(dataUpdatedAt, sessionStartedAt\)/);
  });

  it('gates the reconciler on the session freshness', () => {
    assert.match(reconciler, /isSessionFresh\(dataUpdatedAt, sessionStartedAt\)/);
  });

  it('gates what the trip screen paints on the session freshness', () => {
    assert.match(screen, /isSessionFresh\(dataUpdatedAt, sessionStartedAt\)/);
    assert.match(screen, /const data = hasFreshData \? query\.data : undefined/);
  });

  it('runs the sync and the reconciliation on every new response, not only on a new code', () => {
    assert.match(persistence, /\}, \[dataUpdatedAt, userId, sessionStartedAt\]\)/);
    assert.match(reconciler, /\}, \[dataUpdatedAt, userId, sessionStartedAt\]\)/);
  });
});

describe('R-1 and R-4 on the trip screen', () => {
  it('lets a 403 or a 404 of the last request decide the mode, from the shared classification', () => {
    assert.match(screen, /notOwnedOrMissing: isError && isNotOwnedOrMissing\(error\)/);
  });

  it('on not found, clears the record and its pickup point, resets the draft and goes home with the notice', () => {
    const block = /mode\.kind !== 'not_found'[\s\S]*?\[mode\.kind\]\)/.exec(screen)?.[0] ?? '';
    assert.match(block, /startCodeRecordStore\.clear\(\)/);
    assert.match(
      block,
      /recordBelongsToAnotherTrip\(startCodeRecordStore\.getSnapshot\(\), tripRequestId\)/,
    );
    assert.match(block, /resetDraft\(\)/);
    assert.match(block, /TRIP_NOT_FOUND_NOTICE/);
    assert.match(block, /router\.replace/);
  });

  it('paints nothing of the trip in the not found mode', () => {
    assert.match(
      screen,
      /if \(mode\.kind === 'not_found'\) \{\s*return <View style=\{\{ flex: 1, backgroundColor: theme\.colors\.bg \}\} testID="trip-not-found" \/>;/,
    );
  });

  it('reads the pickup point from the disk only when the owner is known', () => {
    assert.match(screen, /canRestorePickup\(\{ restoredRecord, tripRequestId, hasFreshData \}\)/);
    assert.match(pickup, /!canRestore\) return;/);
  });

  it('draws the saved view only from a record that is valid for this user and this trip', () => {
    assert.match(persistence, /usableRecord\(snapshot, \{/);
  });
});

describe('the record is never created from a screen that did not show it', () => {
  it('writes only from the screen sync, which sees the code, and never from the reconciler', () => {
    assert.match(persistence, /startCodeRecordStore\.sync\(/);
    assert.match(reconciler, /startCodeRecordStore\.reconcile\(/);
    assert.doesNotMatch(reconciler, /\.sync\(/);
  });

  it('seeds the cache with the response of the server, never with a record (C-8)', () => {
    assert.match(reconciler, /cache\.seed\(data\)/);
    assert.doesNotMatch(reconciler, /snapshot\.record\.start_code/);
    assert.doesNotMatch(source('../components/SavedTripView.tsx'), /setQueryData|seed\(/);
  });

  it('passes the route only the trip and the source, never the code (C-8)', () => {
    assert.match(startup, /router\.replace\(savedTripRoute\(decision\.record\)\)/);
  });
});

describe('the clean-up events are hooked up', () => {
  it('clears the record and its pickup point when the passenger cancels', () => {
    assert.match(cancel, /void startCodeRecordStore\.clear\(\)/);
  });

  it('has a single handler for the end of the session, in the record runtime', () => {
    assert.match(startCodeRuntime, /onSessionCleared\(\(\) => startCodeRecordStore\.clear\(\)\)/);
    assert.doesNotMatch(pickupRuntime, /onSessionCleared/);
  });

  it('resets the in-memory trip state of the previous user when the session ends (CS-13)', () => {
    assert.match(startCodeRuntime, /onSessionCleared\(resetTripSessionState\)/);
    assert.match(
      startCodeRuntime,
      /import \{ resetTripSessionState \} from '..\/state\/reset-trip-session-state'/,
    );
  });

  it('tells the record store about the pickup point as a companion key', () => {
    assert.match(startCodeRuntime, /companionKeys: \[PICKUP_ORIGIN_KEY\]/);
  });

  it('prepares the record store before the session is restored, and mounts the reconciler at the root', () => {
    assert.match(layout, /startCodeRecordStore\.ready\(\);\s*void hydrate\(\)/);
    assert.match(layout, /useStartCodeReconciler\(\)/);
  });

  it('discards an unusable record, and any record without a session, from the startup decision', () => {
    assert.match(startup, /if \(discardRecord\) void startCodeRecordStore\.clear\(\)/);
  });

  it('never runs a startup decision after the passenger chose to continue home (C-7)', () => {
    assert.match(startup, /if \(!authenticated \|\| skipped \|\| routed\) return;/);
  });
});

describe('the startup does not change the time-outs of the requests', () => {
  it('uses the 4 second threshold only to decide what to show, not to cancel anything', () => {
    assert.match(startup, /setTimeout\(\(\) => setSlowSignal\(true\), SLOW_SIGNAL_THRESHOLD_MS\)/);
    assert.doesNotMatch(startup, /cancelQueries|AbortController|REQUEST_TIMEOUT/);
  });

  it('passes the restored flag on to the notification tap routing', () => {
    assert.match(routing, /startupRestored: startupRestoredRef\.current/);
    assert.match(layout, /startupRestored: startup\.restored/);
  });
});

describe('the new session is not ended or confirmed by the previous one (CS-14, D-CS-05, D-CS-08)', () => {
  it('asks the server for a trip only while there is a session, so a stale screen stops polling', () => {
    assert.match(
      tripStatusQuery,
      /enabled: tripStatusQueryEnabled\(tripRequestId, authenticated\)/,
    );
    assert.match(tripStatusQuery, /s\.status === 'authenticated'/);
  });

  it('ends the session on a 401 only for the request that carried the current token', () => {
    assert.match(httpClient, /usedToken !== null &&/);
    assert.match(
      httpClient,
      /if \(authHandlers\.getAccessToken\(\) === usedToken\) authHandlers\.onSessionExpired\(\);/,
    );
  });

  it('decides the location consent only from an answer obtained in this session', () => {
    assert.match(
      consentGate,
      /freshConsentStatus\(query\.data, query\.dataUpdatedAt, sessionStartedAt\)/,
    );
    assert.match(consentGate, /consentGatePhase\(\{/);
  });

  it('does not let the location sheet hide the not found notice', () => {
    assert.match(
      home,
      /visible=\{noticeToastVisible\(\{\s*pending: notFoundToast,\s*sheetOpen: noticeOpen,\s*phase: gate\.phase,?\s*\}\)\}/,
    );
    assert.match(home, /useState\(gate\.phase === 'needs_notice'\)/);
  });
});
