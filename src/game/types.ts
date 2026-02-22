// PRESSURE - Game Mode System
// Defines the plugin interface that makes the grid engine swappable

import { Tile, Position, GameState } from '../types'

export type WallCompressionSetting = 'always' | 'never' | 'optional'

export interface TapResult {
  tiles: Tile[]
  valid: boolean
  scoreDelta?: number   // for score-based modes
  customState?: Record<string, unknown> // mode-specific state changes
}

export interface WinResult {
  won: boolean
  reason?: string
}

export interface LossResult {
  lost: boolean
  reason?: string
}

export interface GameModeConfig {
  /** Unique identifier */
  id: string

  /** Display name shown in UI */
  name: string

  /** Short description shown in mode selector */
  description: string

  /** Emoji icon for the mode */
  icon: string

  /** Accent color for UI theming */
  color: string

  /**
   * Wall compression behavior:
   * - 'always'   → walls always close (like classic Pressure)
   * - 'never'    → walls never close (Zen mode)
   * - 'optional' → player can toggle it in settings
   */
  wallCompression: WallCompressionSetting

  /**
   * Called when a tile is tapped. Returns the new tile state or null if the tap was invalid.
   * Return null to reject the tap (no move consumed).
   */
  onTileTap: (
    x: number,
    y: number,
    tiles: Tile[],
    gridSize: number,
    modeState?: Record<string, unknown>
  ) => TapResult | null

  /**
   * Called after every valid tap to check win condition.
   */
  checkWin: (
    tiles: Tile[],
    goalNodes: Position[],
    moves: number,
    maxMoves: number,
    modeState?: Record<string, unknown>
  ) => WinResult

  /**
   * Optional: additional loss conditions beyond wall crushing.
   * Wall crushing is always checked by the engine regardless.
   */
  checkLoss?: (
    tiles: Tile[],
    wallOffset: number,
    moves: number,
    maxMoves: number,
    modeState?: Record<string, unknown>
  ) => LossResult

  /**
   * Optional: called every game tick (1 second) for time-based mechanics.
   * Return partial state changes to apply.
   */
  onTick?: (
    state: GameState,
    modeState?: Record<string, unknown>
  ) => Record<string, unknown> | null

  /**
   * Whether this mode supports the undo mechanic.
   * Default: true
   */
  supportsUndo?: boolean

  /**
   * Whether this mode uses the move counter as a limit.
   * Default: true
   */
  useMoveLimit?: boolean

  /**
   * Custom labels for the stats bar.
   */
  statsLabels?: {
    moves?: string
    timer?: string
    compression?: string
  }
}
