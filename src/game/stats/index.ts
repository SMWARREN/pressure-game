// PRESSURE - Stats Module
// Singleton engine + default backend. Import this module once at app startup.
// Swap backends at any time via statsEngine.setBackend(newBackend).

import { StatsEngine } from './engine';
import { LocalStorageStatsBackend } from './backends/localStorage';

// Singleton — shared across the entire app
export const statsEngine = new StatsEngine(new LocalStorageStatsBackend());

// Wire into the Zustand store. No store.ts changes required.
statsEngine.start();

// ── Re-exports ───────────────────────────────────────────────────────────────
export { StatsEngine } from './engine';
export { LocalStorageStatsBackend } from './backends/localStorage';
export { InMemoryStatsBackend } from './backends/memory';
export type { StatsBackend, StatEvent, GameStartEvent, GameEndEvent, StatEventType } from './types';
