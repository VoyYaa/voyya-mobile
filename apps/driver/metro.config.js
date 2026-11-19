const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

const emptyModulePath = path.resolve(projectRoot, 'metro/empty-module.js');
const excludedNativeModules = ['@rnmapbox/maps'];
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (excludedNativeModules.includes(moduleName)) {
    return { type: 'sourceFile', filePath: emptyModulePath };
  }
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  return resolve(context, moduleName, platform);
};
config.cacheStores = [new FileStore({ root: path.join(projectRoot, '.expo', 'metro-cache') })];

module.exports = config;
