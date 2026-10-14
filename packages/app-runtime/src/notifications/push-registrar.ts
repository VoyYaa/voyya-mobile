import type { PushTokenPlatform, RegisterPushTokenDTO } from '@voyyaa/shared';
import { isNetworkError } from '../api/errors';
import { withinDeadline } from '../location/within-deadline';
import type { PushDevicePort } from './push-device-port';
import {
  canRequestPushPermission,
  derivePushPermission,
  type PushPermission,
  type PushPermissionSnapshot,
} from './push-permission';
import type { PushAskedStore } from './push-asked-store';
import type { PushRevoker } from './push-revocation';
import type { PushTokenStore } from './push-token-store';

export type PushRegistrationStatus =
  'idle' | 'registering' | 'registered' | 'failed' | 'pending_offline';

export interface PushSyncOutcome {
  permission: PushPermission;
  registration: Exclude<PushRegistrationStatus, 'registering'>;
}

export interface PushRunOptions {
  ask: boolean;
  online: boolean;
}

export interface PushChannel {
  id: string;
  ensure: () => Promise<void>;
}

export interface PushRegistrarDeps {
  device: PushDevicePort;
  supportedPlatforms: readonly PushTokenPlatform[];
  channel: PushChannel;
  register: (dto: RegisterPushTokenDTO) => Promise<void>;
  tokenStore: Pick<PushTokenStore, 'remember' | 'forget'>;
  askedStore: PushAskedStore;
  revoker: PushRevoker;
  sessionEpoch: () => number;
}

export interface PushRegistrar {
  run: (options: PushRunOptions) => Promise<PushSyncOutcome | null>;
  shutdown: (deadlineMs: number) => Promise<void>;
}

const UNSUPPORTED: PushSyncOutcome = { permission: 'unsupported', registration: 'idle' };

export function createPushRegistrar(deps: PushRegistrarDeps): PushRegistrar {
  const { device, channel } = deps;

  async function permissionOf(snapshot: PushPermissionSnapshot): Promise<PushPermission> {
    const channelEnabled =
      snapshot.status === 'granted' ? await device.isChannelEnabled(channel.id) : true;
    const askedBefore =
      snapshot.status === 'denied' ? await deps.askedStore.read().catch(() => true) : true;
    return derivePushPermission(snapshot, { channelEnabled, askedBefore });
  }

  async function withdrawToken(): Promise<void> {
    await deps.revoker.revokeRemembered();
    await deps.tokenStore.forget().catch(() => undefined);
  }

  let closedAtEpoch: number | null = null;

  function isClosed(): boolean {
    return closedAtEpoch !== null && deps.sessionEpoch() === closedAtEpoch;
  }

  async function registerToken(epoch: number): Promise<PushSyncOutcome['registration']> {
    try {
      const token = await device.getExpoPushToken();
      await deps.register({ token, platform: toTokenPlatform(device) });
      if (deps.sessionEpoch() !== epoch) return 'idle';
      if (isClosed()) {
        await deps.revoker.revokeToken(token);
        return 'idle';
      }
      await deps.tokenStore.remember(token).catch(() => undefined);
      return 'registered';
    } catch (error) {
      return isNetworkError(error) ? 'pending_offline' : 'failed';
    }
  }

  async function execute(options: PushRunOptions): Promise<PushSyncOutcome | null> {
    if (isClosed()) return null;
    const epoch = deps.sessionEpoch();
    const supported =
      deps.supportedPlatforms.some((platform) => platform === device.platform) &&
      (await device.isAvailable());
    if (!supported) return UNSUPPORTED;

    await channel.ensure().catch(() => undefined);
    let permission = await permissionOf(await device.readPermission());
    if (options.ask && canRequestPushPermission(permission)) {
      const answer = await device.requestPermission();
      await deps.askedStore.mark().catch(() => undefined);
      permission = await permissionOf(answer);
    }

    if (permission !== 'granted') {
      await withdrawToken();
      return { permission, registration: 'idle' };
    }
    if (!options.online) return { permission, registration: 'pending_offline' };
    return { permission, registration: await registerToken(epoch) };
  }

  let queue: Promise<unknown> = Promise.resolve();

  return {
    run(options) {
      const result = queue
        .then(() => execute(options))
        .catch((): PushSyncOutcome | null => UNSUPPORTED);
      queue = result;
      return result;
    },
    shutdown(deadlineMs) {
      closedAtEpoch = deps.sessionEpoch();
      return withinDeadline(
        queue.then(
          () => undefined,
          () => undefined,
        ),
        deadlineMs,
        () => undefined,
      );
    },
  };
}

function toTokenPlatform(device: PushDevicePort): PushTokenPlatform {
  return device.platform === 'ios' ? 'ios' : 'android';
}
