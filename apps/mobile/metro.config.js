const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../../');
const webRoot = path.resolve(monorepoRoot, 'apps/web');

// Path aliases — more specific entries must come before shorter prefixes.
// NOTE: bare '@' alias is intentionally omitted — it would intercept scoped
// packages like @expo/metro-runtime. Instead each sub-path is explicit.
config.resolver.alias = {
  '@/game': path.resolve(monorepoRoot, 'src/game'),
  '@/utils': path.resolve(monorepoRoot, 'src/utils'),
  '@/config': path.resolve(monorepoRoot, 'src/config'),
  '@/shared': path.resolve(monorepoRoot, 'src'),
  // Web app aliases (for DOM context) - use relative paths for DOM bundler compatibility
  '@/components': path.join(webRoot, 'components'),
  '@/hooks': path.join(webRoot, 'src/hooks'),
  '@/src': path.join(webRoot, 'src'),
  // Add testing components explicitly
  '@/components/testing': path.join(webRoot, 'components/testing'),
};

// Watch monorepo src + web app for hot reloads
config.watchFolders = [
  ...(config.watchFolders ?? []),
  path.resolve(monorepoRoot, 'src'),
  webRoot,
];

// Enable DOM components ("use dom" directive)
config.dom = { enabled: true };

module.exports = config;
