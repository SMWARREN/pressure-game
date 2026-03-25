/**
 * Game Configuration
 * Control which games and modes are enabled for this domain
 */

export interface GameConfig {
  enabledGames: {
    pressure: boolean;
    arcade: boolean;
  };
  pressureModes: {
    classic: boolean;
    zen: boolean;
    blitz: boolean;
  };
}

/**
 * Domain-specific configurations
 * Add new domains here to customize what games/modes are available
 */
const DOMAIN_CONFIGS: Record<string, GameConfig> = {
  // pressure.click - Only Pressure game with Zen and Blitz
  'pressure.click': {
    enabledGames: {
      pressure: true,
      arcade: false,
    },
    pressureModes: {
      classic: false,
      zen: true,
      blitz: true,
    },
  },

  // Default config for development/other domains
  default: {
    enabledGames: {
      pressure: true,
      arcade: true,
    },
    pressureModes: {
      classic: true,
      zen: true,
      blitz: true,
    },
  },
};

/**
 * Get configuration for current domain
 */
export function getGameConfig(): GameConfig {
  if (typeof globalThis === 'undefined' || !globalThis.location) {
    return DOMAIN_CONFIGS.default;
  }

  const hostname = globalThis.location.hostname;

  // Exact match first
  if (DOMAIN_CONFIGS[hostname]) {
    return DOMAIN_CONFIGS[hostname];
  }

  // Check for subdomain match (e.g., "www.pressure.click" matches "pressure.click")
  for (const [domain, config] of Object.entries(DOMAIN_CONFIGS)) {
    if (domain !== 'default' && hostname.endsWith(domain)) {
      return config;
    }
  }

  return DOMAIN_CONFIGS.default;
}

/**
 * Check if a game is enabled
 */
export function isGameEnabled(game: 'pressure' | 'arcade'): boolean {
  return getGameConfig().enabledGames[game];
}

/**
 * Check if a Pressure mode is enabled
 */
export function isPressureModeEnabled(mode: 'classic' | 'zen' | 'blitz'): boolean {
  return getGameConfig().pressureModes[mode];
}

/**
 * Get enabled Pressure modes
 */
export function getEnabledPressureModes(): ('classic' | 'zen' | 'blitz')[] {
  const config = getGameConfig().pressureModes;
  return (Object.entries(config)
    .filter(([, enabled]) => enabled)
    .map(([mode]) => mode) as ('classic' | 'zen' | 'blitz')[]).sort();
}
