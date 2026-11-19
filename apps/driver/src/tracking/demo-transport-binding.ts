import type { SessionUser } from '@voyyaa/shared';
import type { TripLocationTransport } from './trip-location-transport';

type SessionOwner = Pick<SessionUser, 'user_id' | 'demo_session'>;

export interface DemoTransportBindingDeps {
  swap: (next: TripLocationTransport) => void;
  defaultTransport: TripLocationTransport;
  createDemoTransport: (center: { lat: number; lng: number }) => TripLocationTransport;
}

export interface DemoTransportBinding {
  sync: (user: SessionOwner | null) => void;
}

const REAL_KEY = 'real';

export function demoTransportKey(user: SessionOwner | null): string {
  const demo = user?.demo_session ?? null;
  return user === null || demo === null
    ? REAL_KEY
    : `demo:${user.user_id}:${demo.center.lat}:${demo.center.lng}`;
}

export function createDemoTransportBinding(deps: DemoTransportBindingDeps): DemoTransportBinding {
  let installedKey = REAL_KEY;

  return {
    sync: (user) => {
      const key = demoTransportKey(user);
      if (key === installedKey) return;
      installedKey = key;
      const demo = user?.demo_session ?? null;
      deps.swap(demo === null ? deps.defaultTransport : deps.createDemoTransport(demo.center));
    },
  };
}
