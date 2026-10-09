const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const plugin = require('./with-navigation-app-queries.js');

function names(entries) {
  return (entries ?? []).map((entry) => entry.$['android:name']);
}

describe('with-navigation-app-queries', () => {
  it('declares only Google Maps, Waze and the geo intent', () => {
    const manifest = plugin.addNavigationQueries({ $: {}, application: [] });
    assert.equal(manifest.queries.length, 1);
    const [queries] = manifest.queries;
    assert.deepEqual(names(queries.package), ['com.google.android.apps.maps', 'com.waze']);
    assert.equal(queries.intent.length, 1);
    assert.deepEqual(names(queries.intent[0].action), ['android.intent.action.VIEW']);
    assert.equal(queries.intent[0].data[0].$['android:scheme'], 'geo');
  });

  it('never asks for the permission to query every package', () => {
    const manifest = plugin.addNavigationQueries({ $: {} });
    assert.equal(JSON.stringify(manifest).includes('QUERY_ALL_PACKAGES'), false);
  });

  it('keeps the queries that were already there and does not duplicate itself', () => {
    const existing = {
      $: {},
      queries: [{ package: [{ $: { 'android:name': 'com.example.other' } }] }],
    };
    plugin.addNavigationQueries(existing);
    plugin.addNavigationQueries(existing);
    const [queries] = existing.queries;
    assert.deepEqual(names(queries.package), [
      'com.example.other',
      'com.google.android.apps.maps',
      'com.waze',
    ]);
    assert.equal(queries.intent.length, 1);
  });
});
