# Pressure Game — Mobile Application Reference

**Purpose**: Maps the entire mobile (Expo/React Native) codebase so future Claude sessions can instantly understand architecture without re-exploring.

**Last Updated**: 2026-03-22
**Scope**: `apps/mobile/` + mobile-specific files in `src/`

> For game engine internals → read `docs/core-agent.md`
> For web app → read `docs/web-agent.md`

---

## Entry Points & App Bootstrap

| File | Purpose |
|------|---------|
| `apps/mobile/App.tsx` | Expo entry point; returns ExpoRoot with require.context |
| `apps/mobile/app/_layout.tsx` | Root layout; StatusBar config; renders `PressureApp` |
| `apps/mobile/components/PressureApp.tsx` | SafeAreaProvider + GameEngineProvider wrapper; renders `MainScreen` |
| `apps/mobile/app/index.tsx` | Null route — all content flows through PressureApp |

---

## Navigation Structure

Modal-based (no React Navigation or Expo Router tabs in use):

- `MainScreen` manages 3 modal states: `showSettings`, `showLevelSelector`
- Default view: `GameBoard` (gameplay)
- Level select: `LevelSelector` modal overlays on top
- Settings: `SettingsScreen` modal overlays on top
- `AppFooter` always visible with Settings/Levels buttons

**Expo Router** is configured (in app.json) but unused — custom modal navigation is used instead.

---

## Screens

### GameBoard (`components/GameBoard.native.tsx`)
Main gameplay interface.
- Responsive tile sizing: width-based 80% usage, height 60%
- Shows: Level header, stats row (moves/score/time), GameGrid, restart button
- Zustand: `tapTile(x,y)`, `restartLevel()`, reads `tiles` / `status` / `moves` / `score`

### LevelSelector (`components/LevelSelector.native.tsx`)
Browse levels by world, switch game modes (Classic/Blitz/Zen).
- Hardcoded progress label "0/40 COMPLETE" — not wired to store
- Calls `getModeById()`, `setGameMode()`, `onLevelSelect()`

### SettingsScreen (`components/SettingsScreen.native.tsx`)
- Toggles: Animations (Zustand), Sound, Haptic Feedback (local state only)
- Sections: Game settings, Data (clear progress), About
- Accessible from AppFooter

### StatsScreen (`components/StatsScreen.native.tsx`)
- Displays stats & achievements (hardcoded dummy data)
- `STATS: false` in `src/config/mobile.ts` — not wired to MainScreen

---

## Components

| Component | File | Purpose |
|-----------|------|---------|
| `MainScreen` | `components/MainScreen.native.tsx` | Top-level navigator; owns modal state |
| `GameGrid` | `components/GameGrid.native.tsx` | Tile grid; O(1) Map-based lookup; memoized |
| `GameTile` | `components/GameTile.native.tsx` | Individual tile; color logic, goal glow; memoized |
| `AppHeader` | `components/AppHeader.native.tsx` | Top bar with gradient, title, icon buttons |
| `AppFooter` | `components/AppFooter.native.tsx` | Bottom bar (Settings/Levels); safe area aware |
| `PressureLogo` | `components/PressureLogo.native.tsx` | Gradient "PRESSURE" text via MaskedView |
| `GameStats` | `components/GameStats.native.tsx` | Stats display (defined but unused) |
| `GameControls` | `components/GameControls.native.tsx` | Control buttons (defined but unused) |
| `TabNavigator` | `components/TabNavigator.native.tsx` | Tab buttons (orphaned, not rendered) |

### Utility Components (`components/`)
`themed-text`, `themed-view`, `icon-symbol`, `collapsible`, `external-link`, `haptic-tab`, `parallax-scroll-view`

---

## Shared Engine Integration

All game logic flows through `src/game/` (monorepo shared):

| Module | Path | What Mobile Uses |
|--------|------|-----------------|
| Store | `src/game/store.ts` | `useGameStore` — all state & actions |
| Types | `src/game/types.ts` | `Tile`, `Level`, `Position`, `Direction` |
| Modes | `src/game/modes/` | `getModeById()`, Classic/Zen/Blitz |
| Provider | `src/game/contexts/GameEngineProvider.tsx` | Wraps app, initializes engines |
| Config | `src/config/mobile.ts` | Feature flags, engine settings |

### Store State Used by Mobile

```
tiles, currentLevel, status, moves, score, wallOffset,
elapsedSeconds, animationsEnabled, currentModeId
```

### Store Actions Used by Mobile

```
loadLevel(), goToMenu(), tapTile(x,y), restartLevel(),
setGameMode(), toggleAnimations()
```

### Metro Aliases

```js
'@/game'   → src/game
'@/utils'  → src/utils
'@/config' → src/config
'@/shared' → src
```

---

## Native Utilities & Storage

| File | Purpose |
|------|---------|
| `src/game/utils/storage.native.ts` | In-memory Map (no persistence); `getItem()`, `setItem()`, `removeItem()` |
| `src/config/mobile.ts` | Feature flags: `STATS: false`; engine: `InMemoryBackend`, `audioEnabled: false` |
| `apps/mobile/hooks/use-color-scheme.ts` | Color scheme detection (mostly unused) |
| `apps/mobile/hooks/use-theme-color.ts` | Theme color hook (mostly unused) |
| `apps/mobile/constants/theme.ts` | Color constants for mobile UI |

**Note**: `storage.native.ts` uses an in-memory Map — **data is lost on app restart**. To fix: use AsyncStorage or MMKV.

---

## Build & Config

| File | Purpose |
|------|---------|
| `apps/mobile/app.json` | Expo config: bundle IDs (`com.saintsea.pressure`), portrait lock, plugins (router, splash, font), New Architecture enabled |
| `apps/mobile/metro.config.js` | Monorepo aliases; watches `src/` for hot reloads |
| `apps/mobile/package.json` | Key deps: expo 55.0.8, react-native 0.83.2, zustand 4.5.5, react 19.2.0 (pinned exact) |
| `apps/mobile/tsconfig.json` | Strict mode, ES2020 target, no DOM lib, path aliases |
| `pnpm-workspace.yaml` (root) | Workspaces: `apps/web`, `apps/mobile` |

### Build Scripts

```bash
npm run start        # expo start
npm run ios          # native iOS build
npm run android      # native Android build
npm run web          # web preview via Expo
```

### Key Dependencies

- `expo 55.0.8` + `react-native 0.83.2`
- `react 19.2.0` (pinned exact — must match web workspace)
- `react-native-reanimated ~4.2.1` (installed but unused)
- `zustand 4.5.5` (shared with web)
- `@expo/vector-icons` for icons

---

## Known Issues & Gotchas

1. **No Data Persistence** — `InMemoryBackend` loses all data on restart. Fix: AsyncStorage or MMKV.
2. **Stats Screen Disabled** — `STATS: false` in `mobile.ts`; not added to `MainScreen`.
3. **Progress Hardcoded** — "0/40 COMPLETE" in LevelSelector is not connected to store.
4. **Audio Disabled** — `audioEnabled: false` in `mobile.ts`; untested on device.
5. **Haptic Not Wired** — Settings toggle exists in local state only; not connected to `tapTile`.
6. **TabNavigator Orphaned** — Defined but never rendered (modal nav used instead).
7. **Sound State Unconnected** — Local state only, not persisted.
8. **Expo Router Unused** — Configured in app.json but app uses custom modal navigation.
9. **Reanimated Unused** — v4.2.1 installed but never imported.
10. **`apps/mobile-new/`** — Experimental parallel build; not in pnpm workspace; purpose unclear.
11. **Safe Area Partial** — Only AppFooter uses safe area insets; GameBoard/Header could improve for notches.
12. **No Error Boundaries** — App will crash if engine fails; add `<ErrorBoundary>` for resilience.
13. **Hard-Coded Colors** — Many inline hex values (e.g., `#06060f`, `#6366f1`); should use `constants/theme.ts`.

---

## Quick Navigation

### Find a Screen
- Game: `apps/mobile/components/GameBoard.native.tsx`
- Levels: `apps/mobile/components/LevelSelector.native.tsx`
- Settings: `apps/mobile/components/SettingsScreen.native.tsx`
- Stats: `apps/mobile/components/StatsScreen.native.tsx`

### Find Navigation Logic
- `apps/mobile/components/MainScreen.native.tsx` — modal state, routing

### Find Build Config
- Expo: `apps/mobile/app.json`
- Metro: `apps/mobile/metro.config.js`
- Deps: `apps/mobile/package.json`

### Find Mobile-Specific Engine Config
- `src/config/mobile.ts` — feature flags, backend choice
- `src/game/utils/storage.native.ts` — native storage implementation

### Ask Core Agent For
- Store state fields and actions → `docs/core-agent.md § Store Architecture`
- How tile rotation works → `docs/core-agent.md § Tile System`
- How modes plug in → `docs/core-agent.md § Mode Plugin System`
- How persistence backends work → `docs/core-agent.md § Persistence System`
- Achievement system → `docs/core-agent.md § Achievement System`

---

## Cross-Reference

- Core engine details → `docs/core-agent.md`
- Web app components → `docs/web-agent.md`
- Agent coordination rules → `docs/AGENTS.md`
