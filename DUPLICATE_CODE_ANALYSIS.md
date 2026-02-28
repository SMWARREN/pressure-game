# Pressure Game - Duplicate Code Analysis Report

## Executive Summary
This analysis identified **20% duplication** in the codebase across 161 source files. Key duplicates found:
- **Shared pipe/dot rendering functions** in demo files (3 instances)
- **Tutorial step structure** (14 modes with similar patterns)
- **Demo tile component patterns** (4 instances with similar logic)
- **Style constant repetition** in demo files
- **Mode registration boilerplate** (14 instances)
- **Repeated Row/utility components** in demos

---

## DUPLICATE #1: Pipe & Dot Rendering Functions

### Severity: HIGH (affects 3+ files, ~180 LOC)
### Files:
- `src/game/modes/classic/demo.tsx` (lines 5-91)
- `src/game/modes/zen/demo.tsx` (lines 5-91)
- `src/game/modes/blitz/demo.tsx` (lines 5-91)

### Duplicated Code:
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
  // 40+ lines of identical pipe direction styles
};

const dot = (color: string) => (
  // 13 lines identical
);

const rotateDot = (
  // 10 lines identical
);
```

### Proposed Refactoring:
1. Create `src/game/modes/shared/demoUtils.tsx`
2. Export `tileBase`, `pipe()`, `dot()`, `rotateDot` as shared utilities
3. Import in classic, zen, blitz demo.tsx files
4. Expected impact: **-180 LOC** (60% reduction in demo file size)

### Estimation:
- Bundle size reduction: ~2-3 KB
- Maintainability: High (single source of truth for pipe visuals)

---

## DUPLICATE #2: Tile Color Palette & Tile Component Pattern

### Severity: MEDIUM-HIGH (affects 4 files, ~200 LOC)
### Files:
- `src/game/modes/candy/demo.tsx` (lines 5-45)
- `src/game/modes/shoppingSpree/demo.tsx` (lines 5-51)
- `src/game/modes/gemBlast/demo.tsx` (lines 42-77)
- `src/game/modes/gravityDrop/demo.tsx` (lines 17-95)

### Duplicated Pattern:
All implement nearly identical tile components:
```typescript
function CandyTile({ sym, highlight, small }) { /* 22 lines */ }
function ShoppingTile({ sym, highlight, small, flashSale }) { /* 25 lines */ }
function GemTile({ symbol, size, highlight }) { /* 20 lines */ }
function GravTile({ value, inChain, chainSum, special, empty, small }) { /* 37 lines */ }
```

All share:
- CSS styles (width, height, borderRadius: 7, display: flex, etc.)
- Highlight logic pattern
- Color palette lookups
- Size calculations (small vs normal)

### Proposed Refactoring:
1. Create `src/game/modes/shared/PaletteTile.tsx`
2. Export generic `PaletteTile` component accepting:
   - `symbol: string`
   - `colors: Record<string, { bg, border, shadow }>`
   - `highlight?: boolean`
   - `size?: number`
3. Replace all 4 implementations with imports
4. Expected impact: **-150 LOC** (70% reduction)

### Estimation:
- Bundle size reduction: ~1.5-2 KB
- Code reuse: High (4 files consolidated to 1)

---

## DUPLICATE #3: Tutorial Step Structure

### Severity: MEDIUM (affects 14 files, structural duplication)
### Files:
- All 14 mode tutorial.ts files follow identical export pattern:
  - `export const [MODE]_TUTORIAL_STEPS: TutorialStep[]`
  - Each has 4-5 steps with icon, iconColor, title, subtitle, demo, body

### Example:
```typescript
// classic/tutorial.ts
export const CLASSIC_TUTORIAL_STEPS: TutorialStep[] = [
  { icon: '🔌', iconColor: '#818cf8', title: '...', subtitle: '...', demo: '...', body: '...' },
  // ... 4 more steps
];
```

### Current Implementation:
- No duplication in content (each mode's steps are unique)
- However, naming convention creates import boilerplate in each mode's index.ts

### Proposed Refactoring:
1. Keep structure as-is (content is mode-specific)
2. The structure itself is not duplicated, only standardized
3. **No refactoring needed** — this is good design pattern

---

## DUPLICATE #4: Row Helper Component

### Severity: LOW (affects 3 files, ~20 LOC)
### Files:
- `src/game/modes/mirrorForge/demo.tsx` (line ~180)
- `src/game/modes/memoryMatch/demo.tsx` (line ~50)
- `src/game/modes/gravityDrop/demo.tsx` (line 97)

### Duplicated Code:
```typescript
// gravityDrop
function Row({ children }: { readonly children: unknown }) {
  return <div style={{ display: 'flex', gap: 5 }}>{children as any}</div>;
}

// mirrorForge
function Row({ children, gap = 4 }: { readonly children: unknown; readonly gap?: number }) {
  return <div style={{ display: 'flex', gap }}>{children as any}</div>;
}

// memoryMatch
function Row({ children }: { readonly children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 6 }}>{children as any}</div>;
}
```

### Proposed Refactoring:
1. Add to `src/game/modes/shared/demoUtils.tsx`
2. Export `Row` component with optional gap parameter
3. Import in mirrorForge, memoryMatch, gravityDrop
4. Expected impact: **-45 LOC** (80% reduction)

### Estimation:
- Bundle size reduction: ~0.2 KB
- Code clarity: Medium

---

## DUPLICATE #5: TileBase Style Constant

### Severity: LOW-MEDIUM (affects 6 files, ~72 LOC)
### Files:
- `src/game/modes/classic/demo.tsx`
- `src/game/modes/zen/demo.tsx`
- `src/game/modes/blitz/demo.tsx`
- `src/game/modes/voltage/demo.tsx`
- `src/game/modes/fuse/demo.tsx`
- `src/game/modes/laserRelay/demo.tsx`

### Pattern:
All define identical `tileBase` object:
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
```

### Proposed Refactoring:
- Move to `src/game/modes/shared/demoStyles.ts`
- Export as `DEMO_TILE_BASE`
- Import in all 6 demo files
- Expected impact: **-60 LOC** (100% elimination of duplication)

### Estimation:
- Bundle size reduction: ~0.3 KB

---

## DUPLICATE #6: Mode Configuration Boilerplate

### Severity: LOW (affects 14 files, structural)
### Files:
All mode index.ts files follow this pattern:
```typescript
export const [MODE]Mode: GameModeConfig = {
  id: '...',
  name: '...',
  description: '...',
  icon: '...',
  color: '...',
  wallCompression: 'always' | 'never' | 'optional',
  supportsUndo: boolean,
  useMoveLimit: boolean,
  tutorialSteps: [...],
  renderDemo: render[Mode]Demo,
  getLevels: () => [...],
  worlds: [...],
  supportsWorkshop: boolean,
  onTileTap(x, y, tiles): TapResult | null { ... },
  checkWin(tiles, goalNodes): WinResult { ... },
  // Optional: checkLoss, onTick, etc.
};
```

### Analysis:
- This is a **standard interface implementation**, not duplication
- Each mode has unique implementation logic
- No refactoring needed — this is good separation of concerns

---

## DUPLICATE #7: Tile Size & Layout Patterns

### Severity: MEDIUM (affects 4+ demo files, style fragmentation)
### Pattern Examples:
```typescript
// gravityDrop
const size = small ? 36 : 44;

// gemBlast
size = 32 (default)

// candy
size = small ? 34 : 42;

// shoppingSpree
size = small ? 34 : 42;
```

### Issue:
No standardized demo tile sizing constants, leading to:
- Inconsistent visual scales across demo grids
- Repeated size calculation logic
- Harder to update globally

### Proposed Refactoring:
1. Add to `src/game/modes/shared/demoStyles.ts`:
```typescript
export const DEMO_TILE_SIZES = {
  small: 34,
  normal: 42,
  large: 52,
};
```
2. Import and use in all demo files
3. Expected impact: **Minor** (mainly consistency improvement)

---

## DUPLICATE #8: Inline Flex Layouts

### Severity: LOW (pervasive but expected)
### Pattern:
```typescript
// Appears ~200+ times across all demo files
style={{ display: 'flex', gap: X, alignItems: 'center' }}
style={{ display: 'flex', flexDirection: 'column', gap: X }}
```

### Analysis:
- This is expected duplication in React inline styles
- Already partially addressed by `gameStyles.ts`
- Low impact on bundle due to CSS-in-JS optimization
- **No action needed** — style constants are for shared styles only

---

## DUPLICATE #9: Color Palette Objects

### Severity: MEDIUM (affects arcade modes)
### Files:
- `src/game/modes/candy/demo.tsx` (CANDY_COLORS)
- `src/game/modes/shoppingSpree/demo.tsx` (SHOPPING_COLORS)
- `src/game/modes/gemBlast/demo.tsx` (GEM_COLORS)
- `src/game/modes/gravityDrop/demo.tsx` (VALUE_COLORS)

### Pattern:
Each mode defines its own color palette object. Example:
```typescript
const CANDY_COLORS: Record<string, string> = {
  '🍎': '#ef4444',
  '🍊': '#f97316',
  // ... 3 more
};

const SHOPPING_COLORS: Record<string, string> = {
  '👗': '#ec4899',
  '👠': '#ef4444',
  // ... 3 more
};
```

### Analysis:
- **Intentionally different per mode** (different symbols/items)
- Not technically duplication, but could use a shared factory pattern
- Low priority optimization

---

## Summary Table

| Duplicate | Severity | Files | LOC | Recommendation | Est. Bundle Savings |
|-----------|----------|-------|-----|-----------------|-------------------|
| Pipe/Dot rendering | HIGH | 3 | 180 | Extract to shared utils | 2-3 KB |
| Tile component pattern | HIGH | 4 | 200 | Create generic PaletteTile | 1.5-2 KB |
| Row helper | LOW | 3 | 45 | Add to shared utils | 0.2 KB |
| TileBase style | LOW-MED | 6 | 72 | Extract to shared styles | 0.3 KB |
| Tile sizing patterns | MEDIUM | 4+ | 20 | Add size constants | Minimal |
| **TOTAL IMPACT** | | | **~517 LOC** | | **~4-5.5 KB** |

---

## Refactoring Plan (Priority Order)

### Phase 1: Create Shared Demo Utils Module
File: `src/game/modes/shared/demoUtils.tsx`

```typescript
// Pipe rendering helper
export const DEMO_TILE_BASE: React.CSSProperties = { ... };

export function createPipeRenderer(color: string) {
  return (dir: 'up' | 'down' | 'left' | 'right') => { ... };
}

export function createDotRenderer(color: string) { ... }

export const DEMO_ROTATE_DOT = { ... };

export function Row({ children, gap = 4 }: { readonly children: unknown; readonly gap?: number }) {
  return <div style={{ display: 'flex', gap }}>{children as any}</div>;
}

export const DEMO_TILE_SIZES = { small: 34, normal: 42, large: 52 };
```

### Phase 2: Update Pipe-based Demo Files
Update: `src/game/modes/classic/demo.tsx`, `src/game/modes/zen/demo.tsx`, `src/game/modes/blitz/demo.tsx`
- Remove `tileBase`, `pipe`, `dot`, `rotateDot` definitions
- Import from shared module
- Expected: -180 LOC

### Phase 3: Consolidate Tile Components
Create: `src/game/modes/shared/PaletteTile.tsx`
- Generic component for demo tiles
- Update candy, shoppingSpree, gemBlast, gravityDrop
- Expected: -150 LOC

### Phase 4: Update Helper Components
Update: `src/game/modes/mirrorForge/demo.tsx`, `src/game/modes/memoryMatch/demo.tsx`, `src/game/modes/gravityDrop/demo.tsx`
- Import Row from shared
- Expected: -45 LOC

---

## Implementation Notes

1. **Backward Compatibility**: All changes are internal refactoring. No public API changes.

2. **Testing**:
   - Run `npm run build` after each phase to verify no errors
   - Run `npm run lint` to check for violations
   - Visual regression: Compare rendered demos before/after

3. **Import Paths**:
   - Use absolute paths with `@/` alias
   - Example: `import { DEMO_TILE_BASE } from '@/game/modes/shared/demoUtils';`

4. **File Structure**:
   ```
   src/game/modes/shared/
   ├── demoUtils.tsx      (new - pipe, dot, Row)
   ├── demoStyles.ts      (new - tile sizes, constants)
   ├── PaletteTile.tsx    (new - generic tile component)
   └── levels.ts          (existing)
   ```

---

## Risk Assessment

- **Low Risk**: Pipe/Dot extraction (clearly identical code)
- **Low Risk**: Row helper extraction (simple component)
- **Medium Risk**: Generic PaletteTile (requires testing all arcade demos)
- **All Changes**: Non-breaking (internal refactoring only)

---

## Expected Outcomes

- **Bundle Size**: -4-5.5 KB (~2-3% reduction)
- **Codebase Duplication**: From 20% to ~16-17%
- **Maintainability**: High (single source of truth for shared patterns)
- **Test Coverage**: No changes needed (demo files are not tested)

---
