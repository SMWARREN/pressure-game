// PRESSURE - Game Mode Registry
// Add new modes here and they automatically appear in the UI.
// Each mode lives in its own folder so it's fully self-contained and swappable.

import { GameModeConfig } from './types'
import { ClassicMode } from './classic/index'
import { ZenMode } from './zen/index'
import { BlitzMode } from './blitz/index'
import { CandyMode } from './candy/index'

export const GAME_MODES: GameModeConfig[] = [ClassicMode, ZenMode, BlitzMode, CandyMode]

export const DEFAULT_MODE_ID = 'classic'

export function getModeById(id: string): GameModeConfig {
  return GAME_MODES.find(m => m.id === id) ?? ClassicMode
}

export { ClassicMode, ZenMode, BlitzMode, CandyMode }
// Export type from local modes/types (not from ../types which re-exports this)
export type { GameModeConfig } from './types'
