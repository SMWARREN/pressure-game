// PRESSURE - Game Mode Registry
// Add new modes here and they automatically appear in the UI.

import { GameModeConfig } from "../types";
import { ClassicMode } from "./ClassicMode";
import { ZenMode } from "./ZenMode";
import { BlitzMode } from "./BlitzMode";

export const GAME_MODES: GameModeConfig[] = [ClassicMode, ZenMode, BlitzMode];

export const DEFAULT_MODE_ID = "classic";

export function getModeById(id: string): GameModeConfig {
  return GAME_MODES.find((m) => m.id === id) ?? ClassicMode;
}

// Re-export everything for convenience
export { ClassicMode, ZenMode, BlitzMode };
export type { GameModeConfig } from "../types";
