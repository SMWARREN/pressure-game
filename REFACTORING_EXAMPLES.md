# Duplicate Code Refactoring - Code Examples

## Phase 1: Pipe & Dot Utilities Extraction

### BEFORE: Classic Demo (src/game/modes/classic/demo.tsx)
```typescript
const tileBase: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 10,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const pipe = (dir: 'up' | 'down' | 'left' | 'right', color: string) => {
  const styles: Record<string, React.CSSProperties> = {
    up: {
      position: 'absolute',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 5,
      height: '53%',
      background: color,
      borderRadius: '3px 3px 0 0',
    },
    down: {
      position: 'absolute',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 5,
      height: '53%',
      background: color,
      borderRadius: '0 0 3px 3px',
    },
    left: {
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      height: 5,
      width: '53%',
      background: color,
      borderRadius: '3px 0 0 3px',
    },
    right: {
      position: 'absolute',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      height: 5,
      width: '53%',
      background: color,
      borderRadius: '0 3px 3px 0',
    },
  };
  return <div key={dir} style={styles[dir]} />;
};

const dot = (color: string) => (
  <div
    style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%,-50%)',
      width: 8,
      height: 8,
      background: color,
      borderRadius: '50%',
      zIndex: 1,
    }}
  />
);

const rotateDot = (
  <div
    style={{
      position: 'absolute',
      top: 3,
      right: 3,
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: '#fcd34d',
      zIndex: 2,
    }}
  />
);

export function renderClassicDemo(
  type: TutorialDemoType,
  modeColor: string
): React.ReactNode | null {
  if (type === 'fixed-path') {
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <div style={{ ...tileBase, background: 'linear-gradient(145deg, #14532d, #0f3d21)' }}>
          {pipe('right', 'rgba(134,239,172,0.9)')}
          {pipe('down', 'rgba(134,239,172,0.9)')}
          {dot('rgba(134,239,172,0.9)')}
        </div>
        {/* ... more tiles */}
      </div>
    );
  }
  // ... rest of demo
}
```

### AFTER: Classic Demo (using shared utilities)
```typescript
import { DEMO_TILE_BASE, pipe, dot, DEMO_ROTATE_DOT } from '@/game/modes/shared/demoUtils';

export function renderClassicDemo(
  type: TutorialDemoType,
  modeColor: string
): React.ReactNode | null {
  if (type === 'fixed-path') {
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <div style={{ ...DEMO_TILE_BASE, background: 'linear-gradient(145deg, #14532d, #0f3d21)' }}>
          {pipe('right', 'rgba(134,239,172,0.9)')}
          {pipe('down', 'rgba(134,239,172,0.9)')}
          {dot('rgba(134,239,172,0.9)')}
        </div>
        {/* ... more tiles */}
      </div>
    );
  }
  // ... rest of demo
}
```

### NEW FILE: src/game/modes/shared/demoUtils.tsx
```typescript
/**
 * Shared demo rendering utilities for tutorial screens
 * Reduces duplication across mode demo files
 */

export const DEMO_TILE_BASE: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 10,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

export const pipe = (dir: 'up' | 'down' | 'left' | 'right', color: string) => {
  const styles: Record<string, React.CSSProperties> = {
    up: {
      position: 'absolute',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 5,
      height: '53%',
      background: color,
      borderRadius: '3px 3px 0 0',
    },
    down: {
      position: 'absolute',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 5,
      height: '53%',
      background: color,
      borderRadius: '0 0 3px 3px',
    },
    left: {
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      height: 5,
      width: '53%',
      background: color,
      borderRadius: '3px 0 0 3px',
    },
    right: {
      position: 'absolute',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      height: 5,
      width: '53%',
      background: color,
      borderRadius: '0 3px 3px 0',
    },
  };
  return <div key={dir} style={styles[dir]} />;
};

export const dot = (color: string) => (
  <div
    style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%,-50%)',
      width: 8,
      height: 8,
      background: color,
      borderRadius: '50%',
      zIndex: 1,
    }}
  />
);

export const DEMO_ROTATE_DOT = (
  <div
    style={{
      position: 'absolute',
      top: 3,
      right: 3,
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: '#fcd34d',
      zIndex: 2,
    }}
  />
);

export interface DemoRowProps {
  readonly children: unknown;
  readonly gap?: number;
}

export function Row({ children, gap = 4 }: DemoRowProps) {
  return <div style={{ display: 'flex', gap }}>{children as any}</div>;
}

export const DEMO_TILE_SIZES = {
  small: 34,
  normal: 42,
  large: 52,
};
```

---

## Phase 2: Generic Palette Tile Component

### BEFORE: Candy Demo (src/game/modes/candy/demo.tsx)
```typescript
const CANDY_COLORS: Record<string, string> = {
  '🍎': '#ef4444',
  '🍊': '#f97316',
  '🍋': '#eab308',
  '🫐': '#6366f1',
  '🍓': '#ec4899',
};

function CandyTile({
  sym,
  highlight = false,
  small = false,
}: {
  readonly sym: string;
  readonly highlight?: boolean;
  readonly small?: boolean;
}) {
  const col = CANDY_COLORS[sym] ?? '#6366f1';
  const size = small ? 34 : 42;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: small ? '1rem' : '1.2rem',
        background: highlight
          ? `linear-gradient(145deg, ${col}44 0%, ${col}22 100%)`
          : 'rgba(10,10,20,0.6)',
        border: `2px solid ${highlight ? col : col + '30'}`,
        boxShadow: highlight ? `0 0 12px ${col}70` : 'none',
        opacity: highlight ? 1 : 0.35,
      }}
    >
      {sym}
    </div>
  );
}

// Usage in demo
<CandyTile sym="🍎" highlight={true} />
```

### BEFORE: Shopping Spree Demo (src/game/modes/shoppingSpree/demo.tsx)
```typescript
const SHOPPING_COLORS: Record<string, string> = {
  '👗': '#ec4899',
  '👠': '#ef4444',
  '👜': '#d97706',
  '💄': '#db2777',
  '💎': '#06b6d4',
};

function ShoppingTile({
  sym,
  highlight = false,
  small = false,
  flashSale = false,
}: {
  readonly sym: string;
  readonly highlight?: boolean;
  readonly small?: boolean;
  readonly flashSale?: boolean;
}) {
  const col = SHOPPING_COLORS[sym] ?? '#ec4899';
  const size = small ? 34 : 42;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: small ? '1rem' : '1.2rem',
        background: highlight
          ? `linear-gradient(145deg, ${col}44 0%, ${col}22 100%)`
          : 'rgba(10,10,20,0.6)',
        border: flashSale ? '2px solid #fbbf24' : highlight ? `2px solid ${col}` : `${col}30`,
        boxShadow: flashSale
          ? '0 0 18px rgba(251,191,36,0.8)'
          : highlight
            ? `0 0 12px ${col}70`
            : 'none',
        opacity: highlight ? 1 : 0.35,
      }}
    >
      {sym}
    </div>
  );
}

// Usage in demo
<ShoppingTile sym="👗" highlight={true} flashSale={false} />
```

### AFTER: Both Using Generic PaletteTile

Candy Demo:
```typescript
import { PaletteTile, DEMO_TILE_SIZES } from '@/game/modes/shared/PaletteTile';

const CANDY_COLORS: Record<string, { bg: string; border: string; shadow: string }> = {
  '🍎': { bg: '#ef4444', border: '#ef4444', shadow: '#ef444470' },
  '🍊': { bg: '#f97316', border: '#f97316', shadow: '#f9731670' },
  '🍋': { bg: '#eab308', border: '#eab308', shadow: '#eab30870' },
  '🫐': { bg: '#6366f1', border: '#6366f1', shadow: '#6366f170' },
  '🍓': { bg: '#ec4899', border: '#ec4899', shadow: '#ec489970' },
};

// Usage
<PaletteTile
  symbol="🍎"
  colors={CANDY_COLORS}
  highlight={true}
  size={DEMO_TILE_SIZES.normal}
/>
```

Shopping Spree Demo:
```typescript
import { PaletteTile, DEMO_TILE_SIZES } from '@/game/modes/shared/PaletteTile';

const SHOPPING_COLORS: Record<string, { bg: string; border: string; shadow: string }> = {
  '👗': { bg: '#ec4899', border: '#ec4899', shadow: '#ec489970' },
  '👠': { bg: '#ef4444', border: '#ef4444', shadow: '#ef444470' },
  '👜': { bg: '#d97706', border: '#d97706', shadow: '#d9770670' },
  '💄': { bg: '#db2777', border: '#db2777', shadow: '#db277770' },
  '💎': { bg: '#06b6d4', border: '#06b6d4', shadow: '#06b6d470' },
};

// Usage with flashSale variant
<PaletteTile
  symbol="👗"
  colors={SHOPPING_COLORS}
  highlight={true}
  size={DEMO_TILE_SIZES.normal}
  flashSale={true}
/>
```

### NEW FILE: src/game/modes/shared/PaletteTile.tsx
```typescript
/**
 * Generic demo tile component for arcade mode tutorials
 * Consolidates CandyTile, ShoppingTile, GemTile, GravTile patterns
 */

export const DEMO_TILE_SIZES = {
  small: 34,
  normal: 42,
  large: 52,
};

interface TileColorScheme {
  bg: string;
  border: string;
  shadow: string;
}

interface PaletteTileProps {
  readonly symbol: string;
  readonly colors: Record<string, TileColorScheme>;
  readonly highlight?: boolean;
  readonly size?: number;
  readonly flashSale?: boolean;
}

export function PaletteTile({
  symbol,
  colors,
  highlight = false,
  size = DEMO_TILE_SIZES.normal,
  flashSale = false,
}: PaletteTileProps) {
  const scheme = colors[symbol] ?? {
    bg: '#6366f1',
    border: '#6366f1',
    shadow: '#6366f170',
  };

  const fontSize = size <= 34 ? '1rem' : '1.2rem';

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        background: highlight
          ? `linear-gradient(145deg, ${scheme.bg}44 0%, ${scheme.bg}22 100%)`
          : 'rgba(10,10,20,0.6)',
        border: flashSale
          ? '2px solid #fbbf24'
          : highlight
            ? `2px solid ${scheme.border}`
            : `2px solid ${scheme.border}30`,
        boxShadow: flashSale
          ? '0 0 18px rgba(251,191,36,0.8)'
          : highlight
            ? `0 0 12px ${scheme.shadow}`
            : 'none',
        opacity: highlight ? 1 : 0.35,
      }}
    >
      {symbol}
    </div>
  );
}
```

---

## Phase 3: Style Constants Extraction

### NEW FILE: src/game/modes/shared/demoStyles.ts
```typescript
/**
 * Shared style constants for mode demo files
 * Eliminates duplication of style definitions across demo.tsx files
 */

import type React from 'react';

export const DEMO_TILE_BASE: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 10,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

export const DEMO_TILE_SIZES = {
  small: 34,
  normal: 42,
  large: 52,
  xlarge: 52,
} as const;

export const DEMO_FLEX_CENTER: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const DEMO_FLEX_COLUMN: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};
```

---

## Phase 4: Row Helper Extraction

### BEFORE: Multiple Files
```typescript
// gravityDrop/demo.tsx
function Row({ children }: { readonly children: unknown }) {
  return <div style={{ display: 'flex', gap: 5 }}>{children as any}</div>;
}

// mirrorForge/demo.tsx
function Row({ children, gap = 4 }: { readonly children: unknown; readonly gap?: number }) {
  return <div style={{ display: 'flex', gap }}>{children as any}</div>;
}

// memoryMatch/demo.tsx
function Row({ children }: { readonly children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 6 }}>{children as any}</div>;
}
```

### AFTER: Using Shared demoUtils.tsx
```typescript
import { Row } from '@/game/modes/shared/demoUtils';

// gravityDrop/demo.tsx
<Row gap={5}>
  <div>{/* content */}</div>
</Row>

// mirrorForge/demo.tsx
<Row gap={4}>
  <div>{/* content */}</div>
</Row>

// memoryMatch/demo.tsx
<Row gap={6}>
  <div>{/* content */}</div>
</Row>
```

---

## Summary of Changes

| Phase | Files Modified | LOC Removed | New Files |
|-------|---|---|---|
| 1 | 3 (classic, zen, blitz) | 180 | demoUtils.tsx (added) |
| 2 | 4 (candy, shopping, gem, gravity) | 150 | PaletteTile.tsx (added) |
| 3 | 6 (classic, zen, blitz, voltage, fuse, laser) | 60 | demoStyles.ts (added) |
| 4 | 3 (mirror, memory, gravity) | 45 | (added to demoUtils) |
| **TOTAL** | **~15 files** | **~435 LOC** | **3 new files** |

---

## Migration Checklist

- [ ] Create demoUtils.tsx with pipe(), dot(), rotateDot, Row
- [ ] Create demoStyles.ts with DEMO_TILE_BASE, DEMO_TILE_SIZES
- [ ] Create PaletteTile.tsx with generic tile component
- [ ] Update classic/demo.tsx (remove tileBase, pipe, dot, rotateDot)
- [ ] Update zen/demo.tsx (remove tileBase, pipe, dot, rotateDot)
- [ ] Update blitz/demo.tsx (remove tileBase, pipe, dot, rotateDot)
- [ ] Update voltage/demo.tsx (import DEMO_TILE_BASE)
- [ ] Update fuse/demo.tsx (import DEMO_TILE_BASE)
- [ ] Update laserRelay/demo.tsx (import DEMO_TILE_BASE)
- [ ] Update candy/demo.tsx (use PaletteTile)
- [ ] Update shoppingSpree/demo.tsx (use PaletteTile)
- [ ] Update gemBlast/demo.tsx (use PaletteTile)
- [ ] Update gravityDrop/demo.tsx (use PaletteTile + Row)
- [ ] Update mirrorForge/demo.tsx (import Row)
- [ ] Update memoryMatch/demo.tsx (import Row)
- [ ] npm run build (verify all passes)
- [ ] npm run lint (verify all passes)
- [ ] Visual testing (compare demo screenshots)
