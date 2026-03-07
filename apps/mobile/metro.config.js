const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add custom resolver for path aliases
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../../');

config.resolver.extraNodeModules = {
  '@/game': path.resolve(monorepoRoot, 'src/game'),
  '@/utils': path.resolve(monorepoRoot, 'src/utils'),
  '@/config': path.resolve(monorepoRoot, 'src/config'),
  '@/shared': path.resolve(monorepoRoot, 'src'),
};

// Add watch folders for monorepo root src directory
config.watchFolders = [
  ...config.watchFolders,
  path.resolve(monorepoRoot, 'src'),
];

module.exports = config;
