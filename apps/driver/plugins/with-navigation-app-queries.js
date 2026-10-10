const { withAndroidManifest } = require('expo/config-plugins');

const NAVIGATION_PACKAGES = ['com.google.android.apps.maps', 'com.waze'];
const GEO_SCHEME = 'geo';
const VIEW_ACTION = 'android.intent.action.VIEW';

function hasPackage(queries, name) {
  return (queries.package ?? []).some((entry) => entry.$['android:name'] === name);
}

function hasGeoIntent(queries) {
  return (queries.intent ?? []).some(
    (entry) =>
      (entry.action ?? []).some((action) => action.$['android:name'] === VIEW_ACTION) &&
      (entry.data ?? []).some((data) => data.$['android:scheme'] === GEO_SCHEME),
  );
}

function addNavigationQueries(manifest) {
  const queries = manifest.queries ?? [];
  const target = queries[0] ?? {};
  for (const name of NAVIGATION_PACKAGES) {
    if (!hasPackage(target, name)) {
      target.package = [...(target.package ?? []), { $: { 'android:name': name } }];
    }
  }
  if (!hasGeoIntent(target)) {
    target.intent = [
      ...(target.intent ?? []),
      {
        action: [{ $: { 'android:name': VIEW_ACTION } }],
        data: [{ $: { 'android:scheme': GEO_SCHEME } }],
      },
    ];
  }
  manifest.queries = [target, ...queries.slice(1)];
  return manifest;
}

function withNavigationAppQueries(config) {
  return withAndroidManifest(config, (modConfig) => {
    addNavigationQueries(modConfig.modResults.manifest);
    return modConfig;
  });
}

module.exports = withNavigationAppQueries;
module.exports.addNavigationQueries = addNavigationQueries;
module.exports.NAVIGATION_PACKAGES = NAVIGATION_PACKAGES;
