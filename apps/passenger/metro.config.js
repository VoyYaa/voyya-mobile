// Metro config con soporte de monorepo (pnpm workspaces + Turborepo). Necesario
// para que Metro resuelva `@voyya/shared` y `@voyya/ui-mobile` (symlinks de
// pnpm) y sus dependencias desde el `node_modules` raíz del repo.
// Receta estándar de Expo para monorepos pnpm (`disableHierarchicalLookup`
// evita que Metro tome versiones hoisted incorrectas).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
