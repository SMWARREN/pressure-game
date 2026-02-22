// PRESSURE - Game Mode System
// Defines the plugin interface that makes the grid engine fully swappable.
//
// To add a completely different game (slots, candy crush, match-3):
//   1. Implement GameModeConfig with your own onTileTap / checkWin logic
//   2. Implement TileRenderer to control how each tile looks
//   3. Register in modes/index.ts

import { Tile, Position, GameState, Level } from '../types';

export type WallCompressionSetting = 'always' | 'never' | 'optional';

export interface TapResult {
  tiles: Tile[];
  valid: boolean;
  scoreDelta?: number;
  customState?: Record<string, unknown>;
}

export interface WinResult {
  won: boolean;
  reason?: string;
}

export interface LossResult {
  lost: boolean;
  reason?: string;
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
  | 'zen-ready';

export interface TutorialStep {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  demo: TutorialDemoType;
  body: string;
}

// ─── Tile Renderer ───────────────────────────────────────────────────────────
//
// Swap this out to completely change the visual language of the grid.
// The engine (GameGrid / GameTile) calls these functions instead of using
// hard-coded pipe logic. Want candy crush? Return circles. Want slots? Return
// spinning symbols. The store and win/loss checking are untouched.
//
// All functions are optional — fall back to the default pipe renderer.

export interface TileColors {
  background: string;
  border: string;
  boxShadow?: string;
}

export interface TileRenderer {
  /**
   * Unique identifier so GameTile knows which rendering branch to use.
   * 'pipe' is the default. Add 'slots' | 'candy' | 'match3' etc. as you create modes.
   */
  type: 'pipe' | 'slots' | 'candy' | string;

  /**
   * Return the background/border/shadow for a tile given its state.
   * If omitted, uses the default pipe palette.
   */
  getColors?: (tile: Tile, ctx: TileRenderContext) => TileColors;

  /**
   * Return content to render inside the tile (emoji, letter, icon, SVG string).
   * For pipe modes this is undefined — pipes draw their own connection lines.
   */
  getSymbol?: (tile: Tile, ctx: TileRenderContext) => string | null;

  /**
   * If true, the pipe connection lines are hidden and the mode draws its own
   * content entirely via getSymbol / getColors.
   */
  hidePipes?: boolean;

  /**
   * Custom CSS font size for the symbol (e.g. '1.4rem').
   * Only used when getSymbol returns a value.
   */
  symbolSize?: string;
}

export interface TileRenderContext {
  isHint: boolean;
  inDanger: boolean;
  justRotated: boolean;
  compressionActive: boolean;
  tileSize: number;
}

// ─── Game Mode Config ─────────────────────────────────────────────────────────

export interface GameModeConfig {
  /** Unique identifier */
  id: string;

  /** Display name shown in UI */
  name: string;

  /** Short description shown in mode selector */
  description: string;

  /** Emoji icon for the mode */
  icon: string;

  /** Accent color for UI theming */
  color: string;

  /**
   * Wall compression behavior:
   * - 'always'   → walls always close (like classic Pressure)
   * - 'never'    → walls never close (Zen mode)
   * - 'optional' → player can toggle it in settings
   */
  wallCompression: WallCompressionSetting;

  /**
   * Controls how tiles are rendered visually.
   * Omit to use the default pipe renderer.
   *
   * Example — a slot machine mode:
   *   tileRenderer: {
   *     type: 'slots',
   *     hidePipes: true,
   *     getSymbol: (tile) => tile.displayData?.symbol as string ?? '?',
   *     getColors: (tile, ctx) => ({ background: '#1a1a2e', border: ctx.inDanger ? '#ef4444' : '#6366f1' }),
   *   }
   */
  tileRenderer?: TileRenderer;

  /**
   * Custom tutorial steps for this mode.
   * If omitted, a generic fallback tutorial is shown.
   */
  tutorialSteps?: TutorialStep[];

  /**
   * Called when a tile is tapped. Returns the new tile state or null if invalid.
   * This is the primary hook for custom game logic — implement match-3 swaps,
   * slot spins, etc. here.
   */
  onTileTap: (
    x: number,
    y: number,
    tiles: Tile[],
    gridSize: number,
    modeState?: Record<string, unknown>
  ) => TapResult | null;

  /**
   * Called after every valid tap to check win condition.
   */
  checkWin: (
    tiles: Tile[],
    goalNodes: Position[],
    moves: number,
    maxMoves: number,
    modeState?: Record<string, unknown>
  ) => WinResult;

  /**
   * Optional: additional loss conditions beyond wall crushing.
   */
  checkLoss?: (
    tiles: Tile[],
    wallOffset: number,
    moves: number,
    maxMoves: number,
    modeState?: Record<string, unknown>
  ) => LossResult;

  /**
   * Optional: return the set of tile keys ("x,y") to highlight on win.
   * Defaults to a pipe-connectivity BFS from the goal nodes.
   * Override this for modes that have a different win-highlight concept
   * (e.g. candy crush "matched" tiles, score chains, etc.)
   */
  getWinTiles?: (tiles: Tile[], goalNodes: Position[]) => Set<string>;

  /**
   * Optional: called every game tick (1 second) for time-based mechanics.
   * Return a partial state update or null for no change.
   */
  onTick?: (
    state: GameState,
    modeState?: Record<string, unknown>
  ) => Record<string, unknown> | null;

  /** Whether this mode supports the undo mechanic. Default: true */
  supportsUndo?: boolean;

  /** Whether this mode uses the move counter as a limit. Default: true */
  useMoveLimit?: boolean;

  /** Custom labels for the stats bar. */
  statsLabels?: {
    moves?: string;
    timer?: string;
    compression?: string;
  };

  /**
   * Returns the full level list for this mode.
   * GameBoard uses this to populate the level selector and world tabs.
   */
  getLevels: () => Level[];

  /**
   * Worlds displayed in the MenuScreen level selector.
   * Each world groups a set of levels with a name, color, and icon.
   */
  worlds: Array<{
    id: number;
    name: string;
    tagline: string;
    color: string;
    icon: string;
  }>;

  /** Whether the Workshop (level generator) tab is shown for this mode. Default: false */
  supportsWorkshop?: boolean;
}
