import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveApiBaseUrl } from './resolve-api-base-url.ts';

describe('resolveApiBaseUrl', () => {
  it('uses the configured URL when present, in development and production', () => {
    for (const isDevelopment of [true, false]) {
      assert.equal(
        resolveApiBaseUrl({
          configuredUrl: 'https://api.example.test',
          metroHostUri: '192.168.1.58:8081',
          isDevelopment,
        }),
        'https://api.example.test',
      );
    }
  });

  it('derives the API URL from the Metro host in development when nothing is configured', () => {
    assert.equal(
      resolveApiBaseUrl({
        configuredUrl: undefined,
        metroHostUri: '192.168.1.58:8081',
        isDevelopment: true,
      }),
      'http://192.168.1.58:3000',
    );
  });

  it('treats an empty configured URL as missing', () => {
    assert.equal(
      resolveApiBaseUrl({ configuredUrl: '', metroHostUri: '10.0.0.7:8082', isDevelopment: true }),
      'http://10.0.0.7:3000',
    );
  });

  it('accepts a host URI with a scheme or a path', () => {
    assert.equal(
      resolveApiBaseUrl({
        configuredUrl: undefined,
        metroHostUri: 'http://10.0.0.7:8081/foo',
        isDevelopment: true,
      }),
      'http://10.0.0.7:3000',
    );
  });

  it('never derives from Metro outside development', () => {
    assert.equal(
      resolveApiBaseUrl({
        configuredUrl: undefined,
        metroHostUri: '192.168.1.58:8081',
        isDevelopment: false,
      }),
      'http://localhost:3000',
    );
  });

  it('falls back to localhost in development when Metro exposes no host', () => {
    for (const metroHostUri of [undefined, null, '']) {
      assert.equal(
        resolveApiBaseUrl({ configuredUrl: undefined, metroHostUri, isDevelopment: true }),
        'http://localhost:3000',
      );
    }
  });
});
