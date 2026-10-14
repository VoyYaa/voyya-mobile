import type { RevokePushTokenDTO } from '@voyyaa/shared';
import { withinDeadline } from '../location/within-deadline';
import type { PushTokenStore } from './push-token-store';

export const PUSH_REVOCATION_DEADLINE_MS = 3000;

export type PushRevocationOutcome = 'none' | 'revoked' | 'failed' | 'timeout';

export interface PushRevokerDeps {
  tokenStore: Pick<PushTokenStore, 'read'>;
  revoke: (dto: RevokePushTokenDTO) => Promise<void>;
  deadlineMs?: number;
}

export interface PushRevoker {
  revokeRemembered: () => Promise<PushRevocationOutcome>;
  revokeToken: (token: string) => Promise<PushRevocationOutcome>;
}

export function createPushRevoker(deps: PushRevokerDeps): PushRevoker {
  const deadlineMs = deps.deadlineMs ?? PUSH_REVOCATION_DEADLINE_MS;

  async function revokeToken(token: string): Promise<PushRevocationOutcome> {
    try {
      return await withinDeadline<PushRevocationOutcome>(
        deps.revoke({ token }).then((): PushRevocationOutcome => 'revoked'),
        deadlineMs,
        () => 'timeout',
      );
    } catch {
      return 'failed';
    }
  }

  return {
    revokeToken,
    async revokeRemembered() {
      try {
        const token = await deps.tokenStore.read();
        return token === null ? 'none' : await revokeToken(token);
      } catch {
        return 'failed';
      }
    },
  };
}
