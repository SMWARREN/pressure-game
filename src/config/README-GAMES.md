# Game Configuration System

Control which games and game modes are enabled for different domains.

## Overview

The configuration system allows you to:
- Enable/disable entire games (Pressure, Arcade)
- Enable/disable specific Pressure modes (Classic, Zen, Blitz)
- Use domain-specific configurations automatically

## File: `games.ts`

### Adding a New Domain Configuration

Edit `src/config/games.ts` and add a new entry to `DOMAIN_CONFIGS`:

```typescript
DOMAIN_CONFIGS: {
  'your-domain.com': {
    enabledGames: {
      pressure: true,   // Show Pressure game
      arcade: false,    // Hide Arcade game
    },
    pressureModes: {
      classic: false,   // Hide Classic mode
      zen: true,        // Show Zen mode
      blitz: true,      // Show Blitz mode
    },
  },
}
```

### Current Configurations

#### `pressure.click` (Example)
- **Pressure**: Enabled
- **Arcade**: Disabled
- **Modes**: Zen & Blitz only (Classic disabled)

#### `default` (Development/Other Domains)
- **Pressure**: Enabled
- **Arcade**: Enabled
- **Modes**: All (Classic, Zen, Blitz)

## How It Works

### Domain Matching

The system automatically detects the current domain:

1. **Exact match**: `pressure.click` matches `pressure.click`
2. **Subdomain match**: `www.pressure.click` matches `pressure.click`
3. **Default fallback**: Unknown domains use the `default` config

### API Functions

Use these functions throughout the app:

```typescript
import {
  getGameConfig,           // Get full config object
  isGameEnabled,           // Check if game is enabled
  isPressureModeEnabled,   // Check if mode is enabled
  getEnabledPressureModes, // Get array of enabled mode names
} from '@/config/games';

// Check if Pressure game is available
if (isGameEnabled('pressure')) { /* ... */ }

// Check if Blitz mode is available
if (isPressureModeEnabled('blitz')) { /* ... */ }

// Get list of available modes: ['zen', 'blitz']
const modes = getEnabledPressureModes();
```

## Implementation Details

### Updated Components

- **PressureHubScreen.tsx**
  - Filters mode buttons based on config
  - Updates header to show only enabled modes
  - Selects first enabled mode as featured level

- **GameBoard.tsx**
  - Only shows ArcadeHubScreen if `arcade` is enabled
  - Only shows PressureHubScreen if `pressure` is enabled

## Deployment

No build changes needed. The configuration is checked at runtime based on `window.location.hostname`.

### Example Deployments

```
Production (pressure.click):
- Zen & Blitz modes only
- No Arcade game

Development (localhost):
- All games and modes enabled

Testing (custom domain):
- Add new domain to DOMAIN_CONFIGS
- Deploy normally
- Configuration applied automatically
```

## Adding New Games/Modes

If you add a new game (e.g., "Laser"):

1. Add to `enabledGames` object:
   ```typescript
   enabledGames: {
     pressure: boolean;
     arcade: boolean;
     laser: boolean;  // New game
   }
   ```

2. Add helper function:
   ```typescript
   export function isLaserEnabled(): boolean {
     return getGameConfig().enabledGames.laser;
   }
   ```

3. Use in components:
   ```typescript
   if (isLaserEnabled()) { /* Show Laser hub */ }
   ```

## Testing Configuration

In development, you can test different configs by temporarily editing `DOMAIN_CONFIGS.default` or using browser dev tools to simulate different hostnames.
