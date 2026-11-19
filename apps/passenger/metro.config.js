const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

config.cacheStores = [new FileStore({ root: path.join(projectRoot, '.expo', 'metro-cache') })];

module.exports = config;
