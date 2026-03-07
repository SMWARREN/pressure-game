// PRESSURE - Shared Level Pool
// One source of truth for Classic, Blitz, and Zen.
// Each mode applies its own ruleset on top of the same puzzles:
//   Classic  → compression active, move limit enforced
//   Blitz    → compression active, no move limit, no undo
//   Zen      → compression disabled (wallCompression: 'never'), no limit
//
// Re-exports from generatedLevels.ts for backwards compatibility.

export { PRESSURE_LEVELS, getPressureLevels } from './generatedLevels';
