# Game Mode Color System - Modular Design

## Philosophy

Each game mode is **completely self-contained and modular**. Modes define their own colors, and the engine/views are completely dumb about them.

**Key Principle:** Views never use global color constants. They ask the current mode for colors.

## Architecture

### 1. Mode Defines Colors

Each mode implements `getColorContext()`:

```typescript
// In your mode file (e.g., modes/candy/index.ts)
import { getModeColorPalette } from '@/game/modes/modeColorFactory';
import { GameModeConfig } from '@/game/modes/types';

export const candyMode: GameModeConfig = {
  id: 'candy',
  name: 'Candy Mode',
  // ... other config

  getColorContext: () => getModeColorPalette('candy'),
  // Or customize:
  // getColorContext: () => createModeColors({
  //   primary: '#ec4899',
  //   secondary: '#f472b6',
  //   nodeGlow: 'rgba(236,72,153,0.6)',
  // }),
};
```

### 2. View Gets Colors from Mode

Views use the `useModeColors()` hook (never hardcoded constants):

```typescript
// In a component
import { useModeColors } from '@/hooks/useModeColors';

export function MyComponent() {
  const colors = useModeColors(); // Gets current mode's colors

  return (
    <div style={{
      background: colors.background,
      borderColor: colors.border,
      color: colors.primary,
    }}>
      {/* Component uses mode colors, never knows about specifics */}
    </div>
  );
}
```

### 3. Engine Stays Dumb

The game engine doesn't know about colors:

```typescript
// In game engine/logic
export function checkWin(tiles, goalNodes, modeState) {
  // Logic determines WIN
  // Colors are NOT the engine's concern
  // Views will use the mode's colors to render the win state
  return { won: true };
}
```

## Color Context Structure

Each mode's `ModeColorContext` includes:

```typescript
interface ModeColorContext {
  // UI Colors
  primary: string;           // Main mode color
  secondary: string;         // Secondary accent
  background: string;        // Mode background
  border: string;           // Border color

  // Tile Colors
  tileDefault: string;      // Default tile
  tileBorder: string;       // Tile border
  tileActive: string;       // Active tile

  // Status Colors
  success: string;          // Win state
  danger: string;           // Loss state
  warning: string;          // Warning state
  info: string;            // Info state

  // Specific States
  nodeGlow: string;        // Goal node
  pathActive: string;      // Active path
  wallColor: string;       // Walls
  crushed: string;         // Crushed tiles

  // Transparent variants
  transparent: {
    white01-04: string;     // White transparencies
    black30-60: string;     // Black transparencies
  };
}
```

## Adding a New Mode

1. **Create mode config** (`modes/mymode/index.ts`):
```typescript
import { GameModeConfig } from '@/game/modes/types';
import { getModeColorPalette } from '@/game/modes/modeColorFactory';

export const myMode: GameModeConfig = {
  id: 'mymode',
  name: 'My Mode',
  icon: '🎮',
  // ... game logic ...
  
  getColorContext: () => getModeColorPalette('mymode'),
};
```

2. **Add color palette** (`modeColorFactory.ts`):
```typescript
export const modeColorPalettes = {
  // ... existing modes ...
  mymode: () => createModeColors({
    primary: '#your-color',
    // ... customize other colors ...
  }),
};
```

3. **Register mode** (`modes/index.ts`):
```typescript
import { myMode } from './mymode';

export const GAME_MODES = {
  // ... existing ...
  mymode,
};
```

4. **Views automatically work** - they use `useModeColors()` and get your mode's colors

## Benefits of This Design

✅ **Modular:** Each mode is completely self-contained
✅ **Portable:** Drop a new mode in, define colors, it works
✅ **Testable:** No global state, colors are part of mode config
✅ **Scalable:** Adding 10 new modes just means adding 10 color palettes
✅ **Maintainable:** Colors live with the mode, not scattered globally
✅ **Flexible:** Each mode can have completely different color scheme

## Migration from Global Constants

### Before (❌ Not Modular)
```typescript
// Global constants
export const RGBA_COLORS = {
  PURPLE_ACCENT: 'rgba(...)',
  RED_ERROR: 'rgba(...)',
  // ... 50 more colors ...
};

// Views hardcode
<div style={{ background: RGBA_COLORS.PURPLE_ACCENT }} />
```

### After (✅ Modular)
```typescript
// Modes define colors
function getColorContext() {
  return createModeColors({ primary: '#a78bfa' });
}

// Views ask the mode
const colors = useModeColors();
<div style={{ background: colors.primary }} />
```

## Examples

### Classic Mode (Purple)
```typescript
classic: () => createModeColors({
  primary: '#a78bfa',
  secondary: '#c4b5fd',
})
```

### Blitz Mode (Orange/Red)
```typescript
blitz: () => createModeColors({
  primary: '#f97316',
  danger: 'rgba(239,68,68,0.5)',
  crushed: 'rgba(239,68,68,0.3)',
})
```

### Custom Mode (Your Theme)
```typescript
myCustomMode: () => createModeColors({
  primary: '#my-brand-color',
  secondary: '#my-accent',
  nodeGlow: '#my-highlight',
  // ... all other colors ...
})
```

## Rules

1. **Every mode MUST implement `getColorContext()`**
2. **Views MUST use `useModeColors()`, never import global constants**
3. **Engine NEVER references colors** - it's view responsibility
4. **Color palette lives in `modeColorFactory.ts`** - single source of truth per mode

This design ensures:
- ✅ You can drop in a brand new mode with zero changes to existing code
- ✅ Views adapt automatically to whatever mode is active
- ✅ Engine logic is completely orthogonal to rendering
