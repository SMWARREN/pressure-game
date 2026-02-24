// PRESSURE - Game Mode System
// Defines the plugin interface that makes the grid engine fully swappable.
//
// To add a completely different game (slots, candy crush, match-3):
//   1. Implement GameModeConfig with your own onTileTap / checkWin logic
//   2. Implement TileRenderer to control how each tile looks
//   3. Register in modes/index.ts

import { Tile, Position, GameState, Level } from '../types';
import { WalkthroughConfig } from '../../components/WalkthroughOverlay';

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

/**
 * Configuration for a single statistic component to be rendered in the GameStats display.
 */
export type StatComponentType = 'moves' | 'compressionBar' | 'countdown' | 'score' | 'timeleft';

export interface StatComponentConfig {
  type: StatComponentType;
  // Future: could add more specific options per component, e.g., { type: 'moves', showMax: true }
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
  | 'candy-group'
  | 'candy-score'
  | 'candy-gravity'
  | 'candy-ready'
  // Outbreak mode demos
  | 'outbreak-start'
  | 'outbreak-frontier'
  | 'outbreak-colors'
  | 'outbreak-ready'
  // Quantum Chain mode demos
  | 'quantum-chain'
  | 'quantum-start'
  | 'quantum-extend'
  | 'quantum-target'
  | 'quantum-flux'
  | 'quantum-ready'
  // Shopping Spree mode demos
  | 'shopping-group'
  | 'shopping-values'
  | 'shopping-flash'
  | 'shopping-cart'
  | 'shopping-ready'
  // Memory Match mode demos
  | 'memory-hidden'
  | 'memory-flip'
  | 'memory-nomatch'
  | 'memory-combo'
  | 'memory-ready'
  // Gravity Drop mode demos
  | 'gravity-board'
  | 'gravity-chain'
  | 'gravity-commit'
  | 'gravity-specials'
  | 'gravity-ready'
  // Mirror Forge mode demos
  | 'mirror-grid'
  | 'mirror-tap'
  | 'mirror-connect'
  | 'mirror-plan'
  | 'mirror-ready';

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
  color?: string;
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
   * Renders a tutorial demo visual for this mode.
   * Returns React node to display in the tutorial screen.
   */
  renderDemo?: (type: TutorialDemoType, modeColor: string) => React.ReactNode | null;

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
   * Return a partial GameState update or null for no change.
   */
  onTick?: (state: GameState, modeState?: Record<string, unknown>) => Partial<GameState> | null;

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
   * Defines which specific statistic components should be rendered and in what order.
   * If not provided, defaults to all available stats in a standard order.
   */
  statsDisplay?: StatComponentConfig[];

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

  /**
   * Custom win/loss overlay titles.
   * Defaults: win → 'CONNECTED', loss → 'CRUSHED'.
   * The dynamic lossReason stored by the store always takes priority over loss.
   */
  overlayText?: {
    win?: string;
    loss?: string;
  };

  /**
   * Optional: return a brief notification to flash above the board after a valid tap.
   * E.g. "1 more!", "COMBO x3", or null for no notification.
   * Score-delta notifications (+N) are handled automatically by GameBoard.
   */
  getNotification?: (
    tiles: Tile[],
    moves: number,
    modeState?: Record<string, unknown>
  ) => string | null;

  /**
   * Optional: provide a function to initialize or reset mode-specific state
   * within the global GameState.modeState object. This is called when a level
   * is loaded or restarted, before `onTileTap` calls.
   */
  initialState?: (state: GameState) => Record<string, unknown>;

  /**
   * Optional: return a set of tile keys ("x,y") to highlight as hints.
   * This is used to show the player which tiles are valid next moves.
   */
  getHintTiles?: (
    tiles: Tile[],
    goalNodes: Position[],
    modeState?: Record<string, unknown>
  ) => Set<string>;

  /**
   * Optional: walkthrough configuration for the first level of this mode.
   * If provided, the walkthrough overlay will be shown when the player
   * starts the specified level for the first time.
   */
  walkthrough?: WalkthroughConfig;
}
