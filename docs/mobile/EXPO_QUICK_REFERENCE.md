# Expo Conversion Quick Reference

## Current Status: ✅ READY TO START
- All 344 unit tests passing
- Production build clean
- No breaking changes needed
- Commit history preserved

---

## Architecture at a Glance

```
SHARED CODE (70-80%)          PLATFORM-SPECIFIC UI (20-30%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

src/game/engine/              apps/web/src/
  ├─ Core game loop             ├─ React components
  ├─ Tile rotation              ├─ CSS styles
  ├─ Win/loss logic             └─ Web UI
  └─ Stats tracking

src/game/modes/               apps/mobile/
  ├─ Classic, Zen, Blitz        ├─ React Native components
  ├─ Advanced modes             ├─ Expo Router screens
  └─ Game rules                 ├─ Native styles
                                └─ Mobile UI

src/game/store/
  └─ Zustand state (works everywhere!)

src/utils/
  ├─ Color utilities
  ├─ Helpers
  └─ Constants
```

---

## Step-by-Step Quick Start

### Step 1: Restructure (30 min)
```bash
# Create apps directory
mkdir -p apps/web apps/mobile

# Move current code to web
mv src apps/web/
mv *.tsx apps/web/
mv package.json apps/web/old-package.json

# Keep shared code at root (don't move)
# The "src" folder at root will contain:
# - game/ (engine, modes, store)
# - utils/
# - config/
```

### Step 2: Create Root package.json (15 min)
```json
{
  "name": "pressure-game-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["apps/web", "apps/mobile"],
  "scripts": {
    "web:dev": "cd apps/web && npm run dev",
    "mobile:start": "cd apps/mobile && expo start",
    "test": "npm run test:web",
    "build": "npm run build:web && npm run build:mobile"
  }
}
```

### Step 3: Initialize Expo App (20 min)
```bash
# Create Expo app with latest SDK 55
cd apps/mobile
npx create-expo-app@latest

# Install shared dependencies
npm install expo@latest expo-router zustand
```

### Step 4: Setup Imports (30 min)
```typescript
// apps/web/tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["../../src/*"]
    }
  }
}

// apps/mobile/tsconfig.json (same)

// Now both apps can:
import { useGameStore } from '@shared/game/store'
import { GameEngine } from '@shared/game/engine'
```

### Step 5: Create Mobile Screens (2-3 hours)
```typescript
// apps/mobile/app/(tabs)/game.tsx
import { useGameStore } from '@shared/game/store'
import GameBoard from '../components/GameBoard.native'

export default function GameScreen() {
  const { currentLevel } = useGameStore()
  return <GameBoard />
}

// apps/mobile/app/(tabs)/levels.tsx
// apps/mobile/app/(tabs)/stats.tsx
```

### Step 6: Build Components (4-5 hours)
```typescript
// apps/mobile/components/GameBoard.native.tsx
// apps/mobile/components/GameTile.native.tsx
// etc. - React Native versions of web components
```

---

## What Stays the Same (NO CHANGES!)

✅ Game engine
✅ Tile rotation logic
✅ Win/loss conditions
✅ Level generation
✅ Mode implementations (Classic, Zen, Blitz, etc.)
✅ Stats tracking
✅ Zustand store
✅ All game rules

**→ 80% of code reused!**

---

## What Changes (UI Only)

❌ Web: React components → Mobile: React Native components
❌ Web: CSS styles → Mobile: StyleSheet/Tailwind
❌ Web: HTML layout → Mobile: Expo Router
❌ Web: Mouse events → Mobile: Touch/Gesture handling

**→ Only the view layer changes!**

---

## File Mapping Reference

| Current | New Location | Notes |
|---------|---|---|
| `src/game/` | `src/game/` ✅ UNCHANGED | Shared by both apps |
| `src/utils/` | `src/utils/` ✅ UNCHANGED | Shared by both apps |
| `src/components/` | `apps/web/src/components/` | Web-only UI |
| `src/App.tsx` | `apps/web/src/App.tsx` | Web entry point |
| NEW | `apps/mobile/app/` | Mobile entry points (Expo Router) |
| NEW | `apps/mobile/components/` | Mobile-specific components |

---

## Key Terminal Commands

```bash
# Development
npm run web:dev              # Run web app
npm run mobile:start         # Run mobile with Expo

# Building
npm run build:web           # Production build for web
npm run build:mobile        # Build for iOS/Android

# Testing
npm test                    # Run all tests
npm run test:web           # Web tests only
npm run test:mobile        # Mobile tests only

# Deployment
cd apps/web && npm run deploy      # Deploy web app
cd apps/mobile && eas build        # Build mobile apps
cd apps/mobile && eas submit       # Submit to stores
```

---

## Expo SDK 55 Key Features

| Feature | Use Case |
|---------|----------|
| **Expo Router** | File-based routing (like Next.js) |
| **EAS Build** | Cloud-based app building |
| **Over-the-air updates** | Push game updates without app store |
| **Native modules** | Access device hardware (camera, sensors) |
| **Expo Go** | Preview app without building |
| **Web support** | Same codebase runs on web |

---

## Typical File Structure After Conversion

```
pressure-game/
├── src/                          ← SHARED
│   ├── game/                     ← Game logic (UNCHANGED)
│   │   ├── engine/
│   │   ├── modes/
│   │   ├── store/
│   │   └── types/
│   └── utils/                    ← Utilities (UNCHANGED)
│
├── apps/
│   ├── web/                      ← React web app
│   │   ├── src/
│   │   │   ├── components/       ← Web React components
│   │   │   ├── App.tsx           ← Web entry
│   │   │   └── tsconfig.json
│   │   └── package.json
│   │
│   └── mobile/                   ← Expo React Native app
│       ├── app/                  ← Expo Router
│       │   ├── (tabs)/           ← Tab navigation
│       │   │   ├── game.tsx
│       │   │   ├── levels.tsx
│       │   │   └── stats.tsx
│       │   └── _layout.tsx       ← Root layout
│       ├── components/           ← Native components
│       │   ├── GameBoard.native.tsx
│       │   └── GameTile.native.tsx
│       ├── app.json              ← Expo config
│       ├── eas.json              ← Build config
│       └── package.json
│
├── package.json                  ← Root with workspaces
├── tsconfig.json
├── EXPO_CONVERSION_PLAN.md       ← This file
└── EXPO_QUICK_REFERENCE.md       ← Quick guide
```

---

## Pre-Conversion Checklist

- [x] All 344 tests passing
- [x] Production build succeeds
- [x] No uncommitted changes
- [x] Read Expo documentation (SDK 55.0.0)
- [x] Plan created and reviewed
- [ ] Approve this plan?
- [ ] Start Phase 1?

---

## Estimated Timeline

- **Phase 1 (Setup)**: 1 day
- **Phase 2 (Shared Code)**: 1 day
- **Phase 3 (Mobile UI)**: 2 days
- **Phase 4 (Styling)**: 1 day
- **Phase 5 (Testing)**: 1 day
- **Phase 6 (Deploy)**: 1 day

**Total: 7 days** (with one day buffer)

---

## Success Criteria

✅ Both web and mobile apps load
✅ Game mechanics work identically
✅ All 344 tests still passing
✅ Mobile app builds and installs
✅ Can play game on iOS, Android, and Web
✅ <80% code duplication
✅ Same game rules everywhere

---

## Next Actions

**If approved:**

1. Create directory structure
2. Initialize Expo project
3. Setup shared code imports
4. Build mobile components
5. Test on simulator
6. Deploy to stores

**Current Status: Ready to begin Phase 1 ✅**

