// PRESSURE - Game Mode System
// Defines the plugin interface that makes the grid engine swappable

import { Tile, Position, GameState } from '../types'

// Re-export core types so consumers can import from one place
export type { Tile, Position, GameState, Direction, Level, GameActions } from '../types'

export type WallCompressionSetting = 'always' | 'never' | 'optional'

export interface TapResult {
  tiles: Tile[]
  valid: boolean
  scoreDelta?: number
  customState?: Record<string, unknown>
}

export interface WinResult {
  won: boolean
  reason?: string
}

export interface LossResult {
  lost: boolean
  reason?: string
}

// ─── Tutorial Step Definition ────────────────────────────────────────────────

export type TutorialDemoType =
  | 'fixed-path'
  | 'rotatable'
  | 'connection'
  | 'node'
  | 'walls'
  | 'controls'
  | 'ready'
  | 'blitz-ready'
  | 'zen-ready'

export interface TutorialStep {
  icon: string
  iconColor: string
  title: string
  subtitle: string
  demo: TutorialDemoType
  body: string
}

// ─── Game Mode Config ─────────────────────────────────────────────────────────

export interface GameModeConfig {
  id: string
  name: string
  description: string
  icon: string
  color: string
  wallCompression: WallCompressionSetting
  tutorialSteps?: TutorialStep[]
  onTileTap: (
    x: number,
    y: number,
    tiles: Tile[],
    gridSize: number,
    modeState?: Record<string, unknown>
  ) => TapResult | null
  checkWin: (
    tiles: Tile[],
    goalNodes: Position[],
    moves: number,
    maxMoves: number,
    modeState?: Record<string, unknown>
  ) => WinResult
  checkLoss?: (
    tiles: Tile[],
    wallOffset: number,
    moves: number,
    maxMoves: number,
    modeState?: Record<string, unknown>
  ) => LossResult
  onTick?: (
    state: GameState,
    modeState?: Record<string, unknown>
  ) => Record<string, unknown> | null
  supportsUndo?: boolean
  useMoveLimit?: boolean
  statsLabels?: {
    moves?: string
    timer?: string
    compression?: string
  }
}
