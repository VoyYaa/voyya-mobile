import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { RevokePushTokenDTO } from '@voyyaa/shared';
import { createPushRevoker } from './push-revocation.ts';

const TOKEN = 'ExponentPushToken[abcdefghijklmnopqrstuv]';

function revoker(options: {
  token: string | null;
  revoke: (dto: RevokePushTokenDTO) => Promise<void>;
  deadlineMs?: number;
}): ReturnType<typeof createPushRevoker> {
  return createPushRevoker({
    tokenStore: { read: async () => options.token },
    revoke: options.revoke,
    deadlineMs: options.deadlineMs,
  });
}

describe('createPushRevoker', () => {
  it('does nothing without a remembered token, without calling the server', async () => {
    let calls = 0;
    const result = await revoker({
      token: null,
      revoke: async () => {
        calls += 1;
      },
    }).revokeRemembered();
    assert.equal(result, 'none');
    assert.equal(calls, 0);
  });

  it('revokes the remembered token without asking Expo for it again', async () => {
    const sent: RevokePushTokenDTO[] = [];
    const result = await revoker({
      token: TOKEN,
      revoke: async (dto) => {
        sent.push(dto);
      },
    }).revokeRemembered();
    assert.equal(result, 'revoked');
    assert.deepEqual(sent, [{ token: TOKEN }]);
  });

  it('never rejects when the server fails', async () => {
    const result = await revoker({
      token: TOKEN,
      revoke: async () => {
        throw new Error('503');
      },
    }).revokeRemembered();
    assert.equal(result, 'failed');
  });

  it('gives up when the server does not answer within the deadline', async () => {
    const startedAt = Date.now();
    const result = await revoker({
      token: TOKEN,
      revoke: () => new Promise<void>(() => undefined),
      deadlineMs: 25,
    }).revokeRemembered();
    assert.equal(result, 'timeout');
    assert.ok(Date.now() - startedAt < 1000);
  });

  it('revokes a token it is given without reading the remembered one', async () => {
    const sent: RevokePushTokenDTO[] = [];
    let reads = 0;
    const result = await createPushRevoker({
      tokenStore: {
        read: async () => {
          reads += 1;
          return null;
        },
      },
      revoke: async (dto) => {
        sent.push(dto);
      },
    }).revokeToken(TOKEN);
    assert.equal(result, 'revoked');
    assert.deepEqual(sent, [{ token: TOKEN }]);
    assert.equal(reads, 0);
  });

  it('never rejects when revoking a given token fails or does not answer', async () => {
    const failing = await revoker({
      token: null,
      revoke: async () => {
        throw new Error('503');
      },
    }).revokeToken(TOKEN);
    assert.equal(failing, 'failed');
    const hung = await revoker({
      token: null,
      revoke: () => new Promise<void>(() => undefined),
      deadlineMs: 20,
    }).revokeToken(TOKEN);
    assert.equal(hung, 'timeout');
  });

  it('never rejects when reading the remembered token fails', async () => {
    const result = await createPushRevoker({
      tokenStore: {
        read: async () => {
          throw new Error('keystore');
        },
      },
      revoke: async () => undefined,
    }).revokeRemembered();
    assert.equal(result, 'failed');
  });
});
