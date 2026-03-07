# Pressure Game: Expo Conversion Plan

## Executive Summary
Convert the existing web-based Pressure Game to a cross-platform mobile/web app using Expo SDK 55.0.0, while preserving all business logic and game engine code. The new structure will have two separate UIs (React for web, React Native for mobile) that share a common game engine, state management, and core utilities.

---

## Architecture Overview

### Current State (Web Only)
```
pressure-game/
├── src/
│   ├── game/          ← SHARED (game engine, rules, logic)
│   ├── utils/         ← SHARED (helpers, colors, utilities)
│   ├── components/    ← WEB ONLY (React components)
│   └── config/        ← SHARED (game config)
└── App.tsx            ← WEB entry point
```

### Target State (Web + Mobile)
```
pressure-game/                          ← Main repo (PRESERVED)
├── src/                                ← SHARED CODE
│   ├── game/
│   │   ├── engine/
│   │   ├── modes/
│   │   ├── store/                      ← Zustand (works on both)
│   │   ├── types/
│   │   └── ...
│   └── utils/
│
├── apps/
│   ├── web/                            ← React 19 (EXISTING)
│   │   ├── src/
│   │   │   ├── components/             ← Web-specific UI
│   │   │   └── App.tsx                 ← Web entry
│   │   └── package.json
│   │
│   └── mobile/                         ← NEW Expo app
│       ├── app/                        ← Expo Router (file-based routing)
│       │   ├── (tabs)/
│       │   │   ├── game.tsx
│       │   │   ├── levels.tsx
│       │   │   └── stats.tsx
│       │   ├── menu/
│       │   ├── settings/
│       │   └── _layout.tsx
│       ├── components/                 ← Mobile-specific UI (React Native)
│       │   ├── GameBoard.native.tsx
│       │   ├── GameTile.native.tsx
│       │   └── ...
│       ├── app.json                    ← Expo config
│       ├── eas.json                    ← EAS Build config (for stores)
│       └── package.json
│
└── packages/                           ← OPTIONAL monorepo setup
    └── shared-game/                    ← Shared logic (future)
        └── src/
            ├── game/
            └── utils/
```

---

## Phase 1: Project Setup (Days 1-2)

### 1.1 Create Directory Structure
```bash
# Create apps directory
mkdir -p apps/web apps/mobile

# Move existing code to apps/web
mv src apps/web/
mv App.tsx apps/web/
mv package.json apps/web/package.json
mv tsconfig.json apps/web/tsconfig.json
# etc...

# Create symlink/reference for shared code
# Option A: Monorepo with workspaces
# Option B: Symlink to parent src
# Option C: Import from ../../../src
```

### 1.2 Initialize Expo App
```bash
cd apps/mobile
npx create-expo-app@latest --template expo-template-bare-minimum
# OR for more features:
npx create-expo-app@latest --template
```

### 1.3 Install Shared Dependencies
```bash
# Root package.json - shared deps
npm install zustand react-native-web expo-router

# Mobile-specific
cd apps/mobile
npm install expo@latest expo-router expo-constants

# Web-specific
cd ../web
npm install react react-dom typescript
```

### 1.4 Update Root package.json
```json
{
  "workspaces": [
    "apps/web",
    "apps/mobile",
    "packages/*"
  ],
  "name": "pressure-game-monorepo"
}
```

---

## Phase 2: Share Core Game Logic (Days 2-3)

### 2.1 Refactor Shared Code Structure
Move shared code to root `src/` directory:
```
src/
├── game/                    ← SHARED: Game engine
├── utils/                   ← SHARED: Utility functions
├── config/                  ← SHARED: Configuration
└── shared/                  ← NEW: Shared types/constants
    ├── types.ts
    ├── constants.ts
    └── hooks/
        ├── useGameStore.ts
        └── useModeColors.ts
```

### 2.2 Create Shared Hooks
```typescript
// src/shared/hooks/useGameStore.ts
export { useGameStore } from '@/game/store'

// src/shared/hooks/useModeColors.ts
export { useModeColors } from '@/game/modes/modeColorFactory'

// These become entry points for both apps
```

### 2.3 Update Web App Imports
```typescript
// Before: import { useGameStore } from '@/game/store'
// After: import { useGameStore } from '../../shared/hooks'

// Or better:
// apps/web/tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/shared/*": ["../../src/shared/*"],
      "@/game/*": ["../../src/game/*"],
      "@/utils/*": ["../../src/utils/*"]
    }
  }
}
```

### 2.4 Export Game Engine as Package
```typescript
// src/index.ts - Entry point for shared code
export * from './game/engine'
export * from './game/store'
export * from './game/types'
export * from './utils'
export * from './config'
```

---

## Phase 3: Create Mobile UI Layer (Days 3-5)

### 3.1 Create Platform-Specific Components
```typescript
// apps/mobile/components/GameBoard.native.tsx
import { View, ScrollView } from 'react-native'
import { GameBoard as BaseGameBoard } from '../../../src/game/types'
import { useGameStore } from '../../../src/shared/hooks'

export function GameBoard() {
  const { tiles, status } = useGameStore()

  return (
    <View style={styles.container}>
      {/* React Native implementation */}
    </View>
  )
}

// apps/mobile/components/GameTile.native.tsx
import { Pressable, Text } from 'react-native'

export function GameTile({ tile, onTap }) {
  return (
    <Pressable onPress={() => onTap(tile)}>
      <Text>{tile.displayData?.value}</Text>
    </Pressable>
  )
}
```

### 3.2 Create Expo Router Structure
```typescript
// apps/mobile/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="game"
        options={{
          title: 'Game',
          tabBarIcon: ({ color }) => <GameIcon color={color} />
        }}
      />
      <Tabs.Screen
        name="levels"
        options={{
          title: 'Levels',
          tabBarIcon: ({ color }) => <LevelsIcon color={color} />
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <StatsIcon color={color} />
        }}
      />
    </Tabs>
  )
}

// apps/mobile/app/(tabs)/game.tsx
import { useGameStore } from '../../src/shared/hooks'
import GameBoard from '../components/GameBoard.native'

export default function GameScreen() {
  const { currentLevel, status } = useGameStore()

  return (
    <View>
      {currentLevel && <GameBoard />}
    </View>
  )
}
```

### 3.3 Handle Platform Differences
```typescript
// apps/mobile/components/AudioPlayer.native.tsx
import { Audio } from 'expo-av'

export async function playSFX(name: string) {
  const soundObject = new Audio.Sound()
  // React Native implementation
}

// apps/web/src/components/AudioPlayer.tsx
// Keep existing Web Audio API implementation
```

### 3.4 Create Native Modules if Needed
```typescript
// apps/mobile/modules/native-game-bridge/
// For any platform-specific game features
// (device sensors, haptics, etc.)
```

---

## Phase 4: Platform-Specific Styling (Days 5-6)

### 4.1 Create Responsive Layouts
```typescript
// apps/mobile/components/styles.ts
import { StyleSheet, useWindowDimensions } from 'react-native'

export const useGameStyles = () => {
  const { width, height } = useWindowDimensions()

  return StyleSheet.create({
    tileSize: {
      width: width / 5,
      height: height / 7,
    },
    // Mobile-optimized styles
  })
}

// apps/web/src/styles/game.css
// Web-optimized CSS (keep existing)
```

### 4.2 Handle Device Features
```typescript
// apps/mobile/hooks/useDeviceFeatures.ts
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'

export function useDeviceFeatures() {
  const insets = useSafeAreaInsets()
  const isTablet = useWindowDimensions().width > 600

  return { insets, isTablet }
}
```

---

## Phase 5: Testing & Build (Days 6-7)

### 5.1 Update Test Configuration
```typescript
// apps/mobile/jest.config.js
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  // ...
}

// Continue running existing web tests
```

### 5.2 Create Build Scripts
```json
{
  "scripts": {
    "web:dev": "cd apps/web && npm run dev",
    "web:build": "cd apps/web && npm run build",
    "mobile:start": "cd apps/mobile && expo start",
    "mobile:build": "cd apps/mobile && eas build",
    "mobile:preview": "cd apps/mobile && expo start --ios",
    "test": "npm run test:web && npm run test:mobile",
    "test:web": "cd apps/web && npm test",
    "test:mobile": "cd apps/mobile && npm test"
  }
}
```

### 5.3 EAS Build Configuration
```json
{
  "eas": {
    "build": {
      "production": {
        "ios": {
          "buildType": "archive"
        },
        "android": {
          "buildType": "apk"
        }
      }
    },
    "submit": {
      "production": {
        "ios": {
          "serviceAccount": "./eas-service-account.json"
        }
      }
    }
  }
}
```

---

## Phase 6: Deployment & Distribution (Days 7-8)

### 6.1 Web Deployment
```bash
# Keep existing deployment (Vercel, Netlify, etc.)
cd apps/web && npm run build && npm run deploy
```

### 6.2 Mobile Distribution
```bash
# iOS via TestFlight
cd apps/mobile && eas build --platform ios && eas submit --platform ios

# Android via Play Store
cd apps/mobile && eas build --platform android && eas submit --platform android
```

---

## Code Sharing Strategy

### ✅ SHARED Across All Platforms
```
src/
├── game/
│   ├── engine/           → Game tick, state updates, win/loss logic
│   ├── modes/            → All game mode implementations
│   ├── levels.ts         → Level data & solver
│   ├── store.ts          → Zustand state (works everywhere)
│   └── types/            → Type definitions
├── utils/
│   ├── conditionalStyles.ts
│   ├── statusColors.ts
│   └── themeColors.ts
└── config/               → Game configuration
```

### ⚠️ PLATFORM-SPECIFIC (Different UI)
```
apps/web/src/components/
├── GameBoard.tsx         → Web React version
├── GameTile.tsx
├── screens/
└── layouts/

apps/mobile/components/
├── GameBoard.native.tsx  → Mobile React Native version
├── GameTile.native.tsx
└── screens/
```

### 🎮 NO CHANGES NEEDED (Game Logic Stays Pure)
- Game engine tick mechanics
- Win/loss condition checking
- Tile rotation logic
- Level solving algorithm
- State management (Zustand)
- Score calculation
- Statistics tracking

### 📝 COMPONENTS TO BUILD (NEW)
- Mobile navigation (Expo Router)
- Mobile touch handlers
- Native UI components (React Native)
- Mobile-specific animations
- Device permission handling
- Push notifications (if needed)

---

## Benefits of This Architecture

| Benefit | Impact |
|---------|--------|
| **Code Reuse** | 70-80% of code shared between web & mobile |
| **Maintenance** | Bug fixes in game engine apply to all platforms |
| **Consistency** | Same game rules, mechanics, progression on all platforms |
| **Development Speed** | Build mobile UI only, not entire game logic |
| **Testing** | Test game engine once, use everywhere |
| **Future-Proof** | Easy to add more platforms (VR, Watch OS, etc.) |

---

## Timeline Summary

| Phase | Days | Deliverable |
|-------|------|-------------|
| 1. Setup | 1-2 | Expo project initialized, directory structure created |
| 2. Share Logic | 2-3 | Game engine accessible from both apps |
| 3. Mobile UI | 3-5 | Core game screens working in React Native |
| 4. Styling | 5-6 | Platform-specific layouts & responsive design |
| 5. Testing | 6-7 | All tests passing on both platforms |
| 6. Deploy | 7-8 | Apps available on web & mobile app stores |

---

## Key Dependencies

```json
{
  "shared": {
    "zustand": "^4.x",
    "typescript": "^5.x"
  },
  "web": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "mobile": {
    "expo": "^55.0.0",
    "expo-router": "^3.x",
    "react-native": "^0.76.0"
  }
}
```

---

## Next Steps (After Approval)

1. ✅ Read & approve this plan
2. 🔧 Phase 1: Create directory structure
3. 🎮 Phase 2: Configure shared code
4. 📱 Phase 3: Build mobile components
5. 🎨 Phase 4: Implement styling
6. ✔️ Phase 5: Test both platforms
7. 🚀 Phase 6: Deploy to stores

---

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| **Breaking changes** | Maintain separate branches until mobile is stable |
| **State sync issues** | Use Zustand's dev tools for debugging |
| **Platform differences** | Create abstractions for platform-specific code |
| **Performance** | Profile on real devices early |
| **Asset management** | Use Expo's built-in asset system |

---

## Questions to Confirm

- [ ] Use monorepo with workspaces or separate repos?
- [ ] Deploy to TestFlight/Play Store immediately or keep as beta?
- [ ] Need backend API integration or local-only?
- [ ] Support for offline play required?
- [ ] Analytics/telemetry integration?

