const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../../');

// Path aliases for monorepo shared src
config.resolver.alias = {
  '@/game': path.resolve(monorepoRoot, 'src/game'),
  '@/utils': path.resolve(monorepoRoot, 'src/utils'),
  '@/config': path.resolve(monorepoRoot, 'src/config'),
  '@/shared': path.resolve(monorepoRoot, 'src'),
};

// When resolving modules from shared src files, look in mobile-new's node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Watch monorepo src for hot reloads
config.watchFolders = [
  ...(config.watchFolders ?? []),
  path.resolve(monorepoRoot, 'src'),
];

module.exports = config;
