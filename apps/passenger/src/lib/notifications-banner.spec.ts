import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { notificationsCopy } from '../copy/notifications-copy.ts';
import {
  BANNER_CONFIRMED_VISIBLE_MS,
  bannerPresentation,
  resolveBannerVariant,
  isPermissionInactive,
  shouldAnnounceBanner,
  shouldShowConfirmation,
  type BannerResolutionInput,
  type NotificationsBannerVariant,
} from './notifications-banner.ts';

const base: BannerResolutionInput = {
  phase: 'searching',
  dismissed: false,
  permission: 'granted',
  registration: 'registered',
  activating: false,
  confirmed: false,
  promptActive: false,
};

function variant(overrides: Partial<BannerResolutionInput>): NotificationsBannerVariant | null {
  return resolveBannerVariant({ ...base, ...overrides });
}

describe('resolveBannerVariant', () => {
  it('shows nothing when everything works, so the screen is not noisy', () => {
    assert.equal(variant({}), null);
    assert.equal(variant({ registration: 'registering' }), null);
    assert.equal(variant({ registration: 'idle' }), null);
    assert.equal(variant({ phase: 'assigned' }), null);
  });

  it('shows nothing until the permission is known, so it does not flicker on every start', () => {
    assert.equal(variant({ permission: 'unknown' }), null);
  });

  it('is askable after "Ahora no" or while the sheet is not on screen', () => {
    assert.equal(variant({ permission: 'undetermined' }), 'askable');
    assert.equal(variant({ permission: 'askable' }), 'askable');
  });

  it('leaves the stage to the sheet while it is open or about to appear', () => {
    assert.equal(variant({ permission: 'undetermined', promptActive: true }), null);
  });

  it('is blocked when the system will not ask again or the channel is off', () => {
    assert.equal(variant({ permission: 'blocked' }), 'blocked');
  });

  it('reports a failed registration when connected, and an offline one when not', () => {
    assert.equal(variant({ registration: 'failed' }), 'failed');
    assert.equal(variant({ registration: 'pending_offline' }), 'offline');
  });

  it('is unsupported on a phone that cannot receive notifications yet', () => {
    assert.equal(variant({ permission: 'unsupported', registration: 'idle' }), 'unsupported');
  });

  it('shows the activation in progress, but not behind the sheet that already shows it', () => {
    assert.equal(variant({ permission: 'askable', activating: true }), 'activating');
    assert.equal(variant({ permission: 'undetermined', activating: true }), 'activating');
    assert.equal(
      variant({ permission: 'undetermined', activating: true, promptActive: true }),
      null,
    );
  });

  it('confirms an activation only once it is registered', () => {
    assert.equal(variant({ confirmed: true }), 'confirmed');
    assert.equal(variant({ confirmed: true, registration: 'failed' }), 'failed');
  });

  it('disappears when the driver arrived, the trip started or it ended', () => {
    for (const phase of ['arrived', 'in_progress', 'ended'] as const) {
      assert.equal(variant({ phase, permission: 'blocked' }), null, phase);
      assert.equal(variant({ phase, registration: 'failed' }), null, phase);
    }
  });

  it('shows on the search and on the assigned and en route steps', () => {
    for (const phase of ['searching', 'assigned', 'en_route'] as const) {
      assert.equal(variant({ phase, permission: 'blocked' }), 'blocked', phase);
    }
  });

  it('stays hidden once the passenger dismissed it for this trip', () => {
    assert.equal(variant({ permission: 'blocked', dismissed: true }), null);
    assert.equal(variant({ registration: 'failed', dismissed: true }), null);
  });

  it('shows the unsupported notice again on a new trip, because dismissing is per trip', () => {
    assert.equal(variant({ permission: 'unsupported', dismissed: false }), 'unsupported');
  });
});

describe('isPermissionInactive', () => {
  it('is inactive while the notifications are not on, and only then', () => {
    for (const permission of ['undetermined', 'askable', 'blocked'] as const) {
      assert.equal(isPermissionInactive(permission), true, permission);
    }
    for (const permission of ['granted', 'unsupported', 'unknown'] as const) {
      assert.equal(isPermissionInactive(permission), false, permission);
    }
  });
});

describe('shouldShowConfirmation', () => {
  it('confirms when a permission that was off becomes granted and registered', () => {
    assert.equal(shouldShowConfirmation(true, 'granted', 'registered'), true);
  });

  it('stays quiet on a silent registration at app start', () => {
    assert.equal(shouldShowConfirmation(false, 'granted', 'registered'), false);
  });

  it('waits for the registration to finish', () => {
    for (const registration of ['idle', 'registering', 'failed', 'pending_offline'] as const) {
      assert.equal(shouldShowConfirmation(true, 'granted', registration), false, registration);
    }
  });

  it('does not confirm a permission that is still off', () => {
    assert.equal(shouldShowConfirmation(true, 'askable', 'idle'), false);
    assert.equal(shouldShowConfirmation(true, 'blocked', 'idle'), false);
  });

  it('keeps the confirmation on screen for four seconds', () => {
    assert.equal(BANNER_CONFIRMED_VISIBLE_MS, 4000);
  });
});

describe('shouldAnnounceBanner', () => {
  it('announces a banner that appears because of a decision of the passenger', () => {
    assert.equal(
      shouldAnnounceBanner({ previous: null, next: 'askable', decisionPending: true }),
      true,
    );
  });

  it('stays silent for a banner that is already there when the screen opens', () => {
    assert.equal(
      shouldAnnounceBanner({ previous: null, next: 'askable', decisionPending: false }),
      false,
    );
  });

  it('announces the outcome that follows an activation in progress', () => {
    for (const next of ['confirmed', 'failed', 'blocked', 'offline', 'askable'] as const) {
      assert.equal(
        shouldAnnounceBanner({ previous: 'activating', next, decisionPending: false }),
        true,
        next,
      );
    }
  });

  it('does not repeat itself or announce a banner that goes away', () => {
    assert.equal(
      shouldAnnounceBanner({ previous: 'askable', next: 'askable', decisionPending: true }),
      false,
    );
    assert.equal(
      shouldAnnounceBanner({ previous: 'askable', next: null, decisionPending: true }),
      false,
    );
  });
});

describe('bannerPresentation', () => {
  it('offers to activate with the bell crossed out and a dismiss control', () => {
    const view = bannerPresentation('askable');
    assert.equal(view.glyph, 'bell_off');
    assert.equal(view.title, 'Avisos apagados');
    assert.equal(view.body, 'Deja la app abierta para ver tu viaje.');
    assert.equal(view.actionLabel, 'Activar avisos');
    assert.equal(view.dismissible, true);
  });

  it('sends a blocked passenger to the phone settings with a hint of where to go', () => {
    const view = bannerPresentation('blocked');
    assert.equal(view.title, 'Avisos apagados en Ajustes');
    assert.equal(view.actionLabel, 'Abrir ajustes');
    assert.equal(
      view.actionHint,
      'Se abre Ajustes del teléfono. Entra a Notificaciones y actívalas para VoyYa.',
    );
  });

  it('lets the passenger retry after a failure, in a neutral tone', () => {
    const view = bannerPresentation('failed');
    assert.equal(view.title, 'No pudimos activar los avisos');
    assert.equal(view.actionLabel, 'Reintentar');
    assert.equal(view.glyph, 'bell_off');
  });

  it('has no button while offline, because the connection banner already offers to retry', () => {
    const view = bannerPresentation('offline');
    assert.equal(view.actionLabel, null);
    assert.equal(view.body, 'Sin conexión. Deja la app abierta para ver tu viaje.');
    assert.equal(view.dismissible, true);
  });

  it('has no button on a phone without support', () => {
    const view = bannerPresentation('unsupported');
    assert.equal(view.title, 'Sin avisos en este teléfono');
    assert.equal(view.actionLabel, null);
  });

  it('shows a spinner while activating, with nothing to tap or dismiss', () => {
    const view = bannerPresentation('activating');
    assert.equal(view.glyph, 'spinner');
    assert.equal(view.title, 'Activando avisos…');
    assert.equal(view.body, null);
    assert.equal(view.actionLabel, null);
    assert.equal(view.dismissible, false);
  });

  it('confirms with the plain bell, and cannot be dismissed because it leaves on its own', () => {
    const view = bannerPresentation('confirmed');
    assert.equal(view.glyph, 'bell');
    assert.equal(view.title, 'Avisos activados');
    assert.equal(view.dismissible, false);
  });

  it('reads title and body as one sentence, so a screen reader announces a single element', () => {
    assert.equal(
      bannerPresentation('askable').accessibilityLabel,
      'Avisos apagados. Deja la app abierta para ver tu viaje.',
    );
    assert.equal(bannerPresentation('confirmed').accessibilityLabel, 'Avisos activados');
  });

  it('never conveys the state only by color: every variant has a glyph and a title', () => {
    const variants: readonly NotificationsBannerVariant[] = [
      'askable',
      'blocked',
      'failed',
      'offline',
      'unsupported',
      'activating',
      'confirmed',
    ];
    for (const name of variants) {
      const view = bannerPresentation(name);
      assert.ok(view.glyph.length > 0, name);
      assert.ok(view.title.length > 0, name);
    }
  });

  it('only has actions that can be handled by the caller', () => {
    const withAction = (['askable', 'blocked', 'failed'] as const).map(
      (name) => bannerPresentation(name).actionLabel,
    );
    assert.deepEqual(withAction, ['Activar avisos', 'Abrir ajustes', 'Reintentar']);
  });
});

describe('notifications copy', () => {
  const texts = (value: unknown): string[] => {
    if (typeof value === 'string') return [value];
    if (typeof value === 'object' && value !== null) return Object.values(value).flatMap(texts);
    return [];
  };
  const all = texts(notificationsCopy);

  it('never promises that notifications always arrive', () => {
    const promises = /siempre|garantiz|no te perder|recibir[aá]s una notificaci/i;
    for (const text of all) assert.doesNotMatch(text, promises, text);
  });

  it('never mentions iPhone, the platform that is not verified', () => {
    for (const text of all) assert.doesNotMatch(text, /iphone|ios|apple/i, text);
  });

  it('never says when the identifier is deleted, since the revocation is best effort', () => {
    for (const text of all) assert.doesNotMatch(text, /borramos|eliminamos|borra |elimina /i, text);
  });

  it('names no data processor in any text of the app', () => {
    for (const text of all) assert.doesNotMatch(text, /expo|google|firebase|fcm|apns/i, text);
  });

  it('keeps the sheet honest about delivery right next to the benefit', () => {
    assert.match(notificationsCopy.sheet.note, /pueden tardar o no llegar/);
  });

  it('uses the app vocabulary and says the viaje continues without notifications', () => {
    assert.match(notificationsCopy.sheet.note, /tu viaje sigue igual/);
    assert.match(notificationsCopy.banner.keepOpen, /Deja la app abierta/);
  });

  it('says the driver indicates the arrival, never that the arrival is a fact', () => {
    assert.equal(notificationsCopy.foreground.driverArrived, 'Tu conductor indica que llegó.');
  });

  it('does not promise a new search after a cancelled trip that ended', () => {
    assert.doesNotMatch(notificationsCopy.foreground.driverCancelledEnded, /asignaremos|buscando/);
  });

  it('has tappable-action labels that are short enough for a 44 dp button', () => {
    for (const label of [
      notificationsCopy.sheet.accept,
      notificationsCopy.sheet.decline,
      notificationsCopy.banner.askable.action,
      notificationsCopy.banner.blocked.action,
      notificationsCopy.banner.failed.action,
    ]) {
      assert.ok(label.length <= 20, label);
    }
  });

  it('warns about logging out with a trip in progress without promising what the server cannot guarantee', () => {
    const note = notificationsCopy.logout.activeTripNote;
    assert.equal(
      note,
      'Tu viaje sigue en curso y no se cancela. Para verlo, tendrás que volver a ingresar.',
    );
    assert.doesNotMatch(note, /dejar[aá] de recibir|avisos/i);
    assert.match(note, /no se cancela/);
  });

  it('keeps the channel texts shown in the system settings short and neutral', () => {
    assert.equal(notificationsCopy.channel.name, 'Avisos de tu viaje');
    assert.ok(notificationsCopy.channel.name.length <= 30);
    assert.doesNotMatch(notificationsCopy.channel.description, /siempre|garantiz/i);
  });
});
