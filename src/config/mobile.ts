// ─── MOBILE APP CONFIG ────────────────────────────────────────────────────────
// Controls what's active during incremental mobile development.
// Flip flags here to progressively enable screens and engine features.

import type { PressureEngineConfig } from '@/game/engine/types';
import { InMemoryBackend } from '@/game/engine/backends';

// ── Screens ────────────────────────────────────────────────────────────────────
// Toggle screens on/off without touching component code.
export const MOBILE_SCREENS = {
  GAME_BOARD: true,
  LEVEL_SELECTOR: true,
  SETTINGS: true,
  STATS: false, // Not yet wired to mobile
};

// ── Engine ─────────────────────────────────────────────────────────────────────
// Mobile engine config — uses InMemoryBackend (no browser-only APIs).
// Set audioEnabled: true once mobile audio synthesis is verified.
export const MOBILE_ENGINE_CONFIG: PressureEngineConfig = {
  storageKey: 'pressure_mobile_v1',
  persistenceBackend: new InMemoryBackend(),
  audioEnabled: false,
  defaultCompressionDelay: 10000,
  tickInterval: 1000,
};
