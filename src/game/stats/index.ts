// PRESSURE - Stats Module
// Pure barrel exports. Create instances via StatsProvider.

export { StatsEngine } from './engine';
export { LocalStorageStatsBackend } from './backends/localStorage';
export { InMemoryStatsBackend } from './backends/memory';
export type { StatsBackend, StatEvent, GameStartEvent, GameEndEvent, StatEventType } from './types';
