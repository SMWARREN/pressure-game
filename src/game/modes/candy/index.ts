// CANDY MODE — Match-3 Group Clear
//
// Tap a connected group of 2+ same-colored candies to clear them.
// Remaining tiles fall (gravity) and new random ones fill from the top.
// Score = n² × 5 per clear (bigger groups = exponentially more points).
// Win: reach targetScore within maxMoves. Loss: moves exhausted without hitting target.
//
// No pipes, no walls — pure match-3 arcade gameplay.

import { GameModeConfig, TapResult, WinResult, LossResult } from '../types';
import { Tile, GameState } from '../../types';
import { getMinGroupSizeForWorld } from '../utils';
import { pickRandom } from '@/utils/conditionalStyles';
import { CANDY_LEVELS, CANDY_WORLDS, CANDY_SYMBOLS } from './levels';
import { CANDY_TUTORIAL_STEPS } from './tutorial';
import { renderCandyDemo } from './demo';
import { CANDY_WALKTHROUGH } from './walkthrough';
import { spawnBlockers, unblockNearGroup } from '../blockingAddon';
import { getBlockerCount, getMinGroupForTime } from '../unlimitedBlockerAddon';
import {
  tryUnlockSymbol,
  expandActiveSymbols,
  updateFreshness,
  applyFreshFlags,
  type SymbolUnlockState,
} from '../symbolUnlockAddon';
import { findGroupWithWildcards, buildTileMap } from '../arcadeShared';
import { findGroup } from '../shared/groupFinder';
import { reshuffleTiles, hasAdjacentMatch } from '../arcadeUtils';
import { WILDCARD_SYMBOL, isWildcard, makeWildcardTile, getWildcardColors } from '../wildcardAddon';
import { BOMB_SYMBOL, isBomb, makeBombTile, applyBombExplosion, getBombColors } from '../bombAddon';
import { updateCombo, resetCombo, comboNotification, type ComboState } from '../comboChainAddon';
import { tickRain } from '../rainAddon';
import { getModeColorPalette } from '../modeColorFactory';

// ── Group finding ────────────────────────────────────────────────────────────
// Uses shared groupFinder.ts for DFS-based connected group detection

// ── Gravity + refill ──────────────────────────────────────────────────────────

/**
 * After clearing tiles, pack survivors to the bottom of each column
 * and fill the top with fresh random candies using the level's active symbols.
 * Frozen tiles (canRotate:false, displayData.frozen:true) fall with gravity too.
 */
function applyGravity(
  tiles: Tile[],
  gridCols: number,
  gridRows: number,
  features?: { wildcards?: boolean; bombs?: boolean }
): Tile[] {
  // Survivors = unfrozen candy tiles + frozen tiles (both fall with gravity)
  const survivors = tiles.filter((t) => t.canRotate || t.displayData?.frozen);
  const activeSymbols =
    (survivors.find((t) => t.canRotate)?.displayData?.activeSymbols as string[]) ?? CANDY_SYMBOLS;

  const result: Tile[] = [];

  for (let col = 0; col < gridCols; col++) {
    const colTiles = survivors.filter((t) => t.x === col).sort((a, b) => b.y - a.y); // highest y (bottom) first

    // Pack existing tiles to the bottom — clear isNew so survivors don't re-animate
    for (let i = 0; i < colTiles.length; i++) {
      const d = colTiles[i].displayData ?? {};
      result.push({
        ...colTiles[i],
        y: gridRows - 1 - i,
        justRotated: false,
        displayData: { ...d, isNew: false },
      });
    }

    // Fill remaining slots from the top with new random candies
    const fillCount = gridRows - colTiles.length;
    for (let row = 0; row < fillCount; row++) {
      const roll = Math.random();
      if (features?.bombs && roll < 0.03) {
        result.push(makeBombTile(col, row, activeSymbols));
      } else if (features?.wildcards && roll < 0.08) {
        result.push(makeWildcardTile(col, row, activeSymbols));
      } else {
        const symbol = pickRandom(activeSymbols);
        result.push({
          id: `cn-${col}-${row}-${Math.random().toString(36).slice(2, 7)}`,
          type: 'path' as const,
          x: col,
          y: row,
          connections: [],
          canRotate: true,
          isGoalNode: false,
          justRotated: true,
          displayData: { symbol, activeSymbols, isNew: true },
        });
      }
    }
  }

  return result;
}

// ── Deadlock detection + reshuffle ────────────────────────────────────────────

/** Returns true if any two adjacent tiles share the same symbol (valid move exists). */
function hasValidMove(tiles: Tile[]): boolean {
  return hasAdjacentMatch(tiles);
}

/** Fisher-Yates shuffle of the symbols while keeping tile positions. */
function reshuffle(tiles: Tile[]): Tile[] {
  return reshuffleTiles(tiles);
}

// ── Tick helper functions ─────────────────────────────────────────────────────

function getExistingFrozenPositions(tiles: Tile[]): Set<string> {
  return new Set(tiles.filter((t) => t.displayData?.frozen).map((t) => `${t.x},${t.y}`));
}

/**
 * Max frozen tile count by time bracket.
 */
const FROZEN_TILE_MAX_BY_TIME: Array<{ timeThreshold: number; maxCount: number }> = [
  { timeThreshold: 8, maxCount: 2 },
  { timeThreshold: 15, maxCount: 1 },
  { timeThreshold: Infinity, maxCount: 0 },
];

function getFrozenTileMaxCount(timeLeft: number): number {
  for (const tier of FROZEN_TILE_MAX_BY_TIME) {
    if (timeLeft <= tier.timeThreshold) return tier.maxCount;
  }
  return 0;
}

// ── Per-symbol color palette (theme-aware) ────────────────────────────────────

const CANDY_COLORS_DARK: Record<string, { bg: string; border: string; glow: string }> = {
  // Base symbols
  '🍎': { bg: '#2d0808', border: '#ef4444', glow: 'rgba(239,68,68,0.5)' },
  '🍊': { bg: '#2d1800', border: '#f97316', glow: 'rgba(249,115,22,0.5)' },
  '🍋': { bg: '#2d2600', border: '#eab308', glow: 'rgba(234,179,8,0.5)' },
  '🫐': { bg: '#0f0f2d', border: '#6366f1', glow: 'rgba(99,102,241,0.5)' },
  '🍓': { bg: '#2d0818', border: '#ec4899', glow: 'rgba(236,72,153,0.5)' },
  // Bonus symbols — unlocked mid-game via 5+ combos
  '🍇': { bg: '#1a0f2d', border: '#8b5cf6', glow: 'rgba(139,92,246,0.5)' },
  '🥝': { bg: '#0f2d0f', border: '#22c55e', glow: 'rgba(34,197,94,0.5)' },
  '🍒': { bg: '#2d0505', border: '#dc2626', glow: 'rgba(220,38,38,0.5)' },
  '🥭': { bg: '#2d1f00', border: '#f59e0b', glow: 'rgba(245,158,11,0.5)' },
  '🍑': { bg: '#2d1408', border: '#fb923c', glow: 'rgba(251,146,60,0.5)' },
  '🍍': { bg: '#2d2800', border: '#fde047', glow: 'rgba(253,224,71,0.5)' },
};

const CANDY_COLORS_LIGHT: Record<string, { bg: string; border: string; glow: string }> = {
  // Base symbols — adjusted for light background
  '🍎': { bg: '#fce4e4', border: '#dc2626', glow: 'rgba(220,38,38,0.3)' },
  '🍊': { bg: '#fed8b1', border: '#d97706', glow: 'rgba(217,119,6,0.3)' },
  '🍋': { bg: '#fef08a', border: '#ca8a04', glow: 'rgba(202,138,4,0.3)' },
  '🫐': { bg: '#e0e7ff', border: '#4f46e5', glow: 'rgba(79,70,229,0.3)' },
  '🍓': { bg: '#fbced5', border: '#be185d', glow: 'rgba(190,24,93,0.3)' },
  // Bonus symbols
  '🍇': { bg: '#ede9fe', border: '#7c3aed', glow: 'rgba(124,58,237,0.3)' },
  '🥝': { bg: '#dcfce7', border: '#16a34a', glow: 'rgba(22,163,74,0.3)' },
  '🍒': { bg: '#fee2e2', border: '#b91c1c', glow: 'rgba(185,28,28,0.3)' },
  '🥭': { bg: '#fef3c7', border: '#92400e', glow: 'rgba(146,64,14,0.3)' },
  '🍑': { bg: '#fed7aa', border: '#c2410c', glow: 'rgba(194,65,12,0.3)' },
  '🍍': { bg: '#fef9e7', border: '#b45309', glow: 'rgba(180,83,9,0.3)' },
};

function getCandyColors(
  theme: 'light' | 'dark'
): Record<string, { bg: string; border: string; glow: string }> {
  return theme === 'light' ? CANDY_COLORS_LIGHT : CANDY_COLORS_DARK;
}

// Color helpers for tile states (extracted to reduce complexity)
function getFreshColors(c: { bg: string; border: string; glow: string }) {
  return {
    background: `linear-gradient(145deg, ${c.bg} 0%, ${c.bg}cc 100%)`,
    border: '2px solid #fbbf24',
    boxShadow: '0 0 18px rgba(251,191,36,0.7), 0 0 6px rgba(251,191,36,0.4)',
  };
}

function getFrozenColors(theme: 'light' | 'dark') {
  const frozenStyles = {
    light: {
      background: 'linear-gradient(145deg, #cffafe 0%, #e0f2fe 100%)',
      border: '2px solid #0369a1',
      boxShadow: '0 0 14px rgba(3,105,161,0.45)',
    },
    dark: {
      background: 'linear-gradient(145deg, #0f1f3d 0%, #091529 100%)',
      border: '2px solid #60a5fa',
      boxShadow: '0 0 14px rgba(96,165,250,0.45)',
    },
  };
  return frozenStyles[theme];
}

function getNewColors(c: { bg: string; border: string; glow: string }, theme: 'light' | 'dark') {
  return {
    background: `linear-gradient(145deg, ${c.bg} 0%, ${c.bg}bb 100%)`,
    border: `2px solid ${theme === 'light' ? '#4f46e5' : '#a5b4fc'}`,
    boxShadow:
      theme === 'light'
        ? '0 0 18px rgba(79,70,229,0.5), 0 0 6px rgba(79,70,229,0.3)'
        : '0 0 18px rgba(165,180,252,0.75), 0 0 6px rgba(165,180,252,0.4)',
  };
}

// Bonus symbols that don't exist in the base pool — unlocked one at a time via 5+ combos.
// Every level starts without these; big combos introduce them as fresh (2× score) tiles.
const CANDY_BONUS_SYMBOLS = ['🍇', '🥝', '🍒', '🥭', '🍑', '🍍'];

// ── Candy score calculation helpers ───────────────────────────────────────────

/**
 * Calculate total candy score from group size and multipliers.
 */
function calculateCandyScore(
  groupSize: number,
  scoreMultiplier: number,
  comboMult: number,
  bonusScore: number
): number {
  return Math.round(groupSize * groupSize * 5 * scoreMultiplier * comboMult) + bonusScore;
}

/**
 * Time bonus tiers by group size.
 */
const CANDY_TIME_BONUS_TIERS: Array<{ minSize: number; bonus: number }> = [
  { minSize: 7, bonus: 5 },
  { minSize: 6, bonus: 4 },
  { minSize: 5, bonus: 3 },
  { minSize: 0, bonus: 2 },
];

/**
 * Calculate time bonus for Unlimited world (world 5).
 */
function calculateCandyTimeBonus(
  groupSize: number,
  timeLeft: number | undefined,
  features: { rain?: boolean; ice?: boolean; blockerIntensity?: 0 | 1 | 2 } | undefined
): number {
  if (timeLeft === undefined) return 0;
  const minGroupForTime = getMinGroupForTime(features);
  if (groupSize < minGroupForTime) return 0;

  for (const tier of CANDY_TIME_BONUS_TIERS) {
    if (groupSize >= tier.minSize) return tier.bonus;
  }
  return 0;
}

/**
 * Process tile clearing, gravity, and reshuffle for candy mode.
 */
function processCandyClear(
  group: Tile[],
  tiles: Tile[],
  extraClearedKeys: Set<string>,
  features:
    | { wildcards?: boolean; bombs?: boolean; comboChain?: boolean; rain?: boolean }
    | undefined,
  gcols: number,
  grows: number,
  unlockState: SymbolUnlockState
): { tiles: Tile[]; unlockState: SymbolUnlockState; newSymbolUnlocked: string | undefined } {
  const clearedKeys = new Set([...group.map((t) => `${t.x},${t.y}`), ...extraClearedKeys]);
  let remaining = tiles.filter((t) => !clearedKeys.has(`${t.x},${t.y}`));

  // Try to unlock new symbol on 5+ groups
  let newUnlockState = unlockState;
  let newSymbolUnlocked: string | undefined;
  if (group.length >= 5) {
    const unlock = tryUnlockSymbol(unlockState);
    if (unlock) {
      newSymbolUnlocked = unlock.symbol;
      newUnlockState = unlock.state;
      remaining = expandActiveSymbols(remaining, unlock.symbol);
    }
  }

  // Apply gravity and reshuffle if needed
  let result = applyGravity(remaining, gcols, grows, features);
  if (!hasValidMove(result)) {
    result = reshuffle(result);
  }

  // Update freshness flags
  newUnlockState = updateFreshness(result, newUnlockState);
  result = applyFreshFlags(result, newUnlockState.freshSymbols);

  return { tiles: result, unlockState: newUnlockState, newSymbolUnlocked };
}

// ── Notification helpers ──────────────────────────────────────────────────────

/**
 * Get timed mode notification by group size and time bonus.
 */
function getTimedNotification(delta: number, groupSize: number, timeBonus: number): string {
  if (groupSize >= 7) return `+${delta} ⏱️+${timeBonus}s 🔥 COMBO!`;
  if (groupSize >= 5) return `+${delta} ⏱️+${timeBonus}s ✨`;
  return `+${delta} ⏱️+${timeBonus}s`;
}

/**
 * Get non-timed mode notification by group size.
 */
function getNonTimedNotification(delta: number, groupSize: number): string | null {
  if (groupSize >= 9) return `+${delta} 💥 MEGA COMBO!`;
  if (groupSize >= 6) return `+${delta} 🔥 GREAT!`;
  return groupSize >= 4 ? `+${delta} ✨ NICE!` : null;
}

// ── onTick helpers (reduce complexity) ────────────────────────────────────────

function processCandyRain(
  updatedTiles: Tile[],
  state: GameState
): {
  updatedTiles: Tile[];
  updatedState: Record<string, unknown> | null;
} {
  const activeSymbols =
    (updatedTiles.find((t) => t.canRotate)?.displayData?.activeSymbols as string[]) ??
    CANDY_SYMBOLS;
  const lastRainAt = (state.modeState?.lastRainAt as number) ?? 0;
  const rainResult = tickRain(
    updatedTiles,
    state.elapsedSeconds,
    lastRainAt,
    activeSymbols,
    state.currentLevel?.gridSize ?? 8
  );

  if (rainResult) {
    return {
      updatedTiles: rainResult.tiles,
      updatedState: {
        ...(state.modeState as Record<string, unknown>),
        lastRainAt: rainResult.lastRainAt,
      },
    };
  }

  return { updatedTiles, updatedState: null };
}

function processCandyIce(
  updatedTiles: Tile[],
  state: GameState,
  updatedState: Record<string, unknown> | null
): {
  updatedTiles: Tile[];
  updatedState: Record<string, unknown> | null;
} {
  const lastIceAt = (state.modeState?.lastIceAt as number) ?? 0;
  if (state.elapsedSeconds < 15 || state.elapsedSeconds - lastIceAt < 15) {
    return { updatedTiles, updatedState };
  }

  const existingFrozen = getExistingFrozenPositions(updatedTiles);
  const iceResult = spawnBlockers(updatedTiles, 'frozen', existingFrozen, {
    spawnChance: 1,
    maxCount: 1,
  });

  if (iceResult) {
    return {
      updatedTiles: iceResult.tiles,
      updatedState: {
        ...(updatedState ?? (state.modeState as Record<string, unknown>)),
        lastIceAt: state.elapsedSeconds,
        iceWarning: `🧊 Ice! Match 4+ to unfreeze!`,
      },
    };
  }

  return { updatedTiles, updatedState };
}

// ── Mode config ───────────────────────────────────────────────────────────────

export const CandyMode: GameModeConfig = {
  id: 'candy',
  name: 'Candy',
  description: 'Tap groups of matching candies to clear them and score points.',
  icon: '🍬',
  color: '#f472b6',
  wallCompression: 'never',
  supportsUndo: false,
  useMoveLimit: true,
  getLevels: () => CANDY_LEVELS,
  worlds: CANDY_WORLDS,
  supportsWorkshop: false,
  overlayText: { win: 'GOAL REACHED!' },

  tileRenderer: {
    type: 'candy',
    hidePipes: true,
    symbolSize: '1.5rem',

    getColors(tile, ctx) {
      if (isWildcard(tile)) return getWildcardColors(tile);
      if (isBomb(tile)) return getBombColors(tile);
      if (!tile.canRotate)
        return { background: 'rgba(10,10,20,0)', border: '1px solid transparent' };

      const colors = getCandyColors(ctx.theme);
      const sym = tile.displayData?.symbol as string;
      const c = colors[sym] ?? {
        bg: ctx.theme === 'light' ? '#f3f4f6' : '#1a1a2e',
        border: ctx.theme === 'light' ? '#6b7280' : '#6366f1',
        glow: ctx.theme === 'light' ? 'rgba(107,114,128,0.3)' : 'rgba(99,102,241,0.4)',
      };

      // Check special states in priority order
      if (tile.displayData?.isFresh) return getFreshColors(c);
      if (tile.displayData?.frozen) return getFrozenColors(ctx.theme);
      if (tile.displayData?.isNew) return getNewColors(c, ctx.theme);

      return {
        background: `linear-gradient(145deg, ${c.bg} 0%, ${c.bg}bb 100%)`,
        border: `2px solid ${c.border}`,
        boxShadow: `0 0 8px ${c.glow}`,
      };
    },

    getSymbol(tile) {
      if (tile.displayData?.frozen) return '🧊';
      if (isWildcard(tile)) return WILDCARD_SYMBOL;
      if (isBomb(tile)) return BOMB_SYMBOL;
      if (!tile.canRotate) return null;
      return (tile.displayData?.symbol as string) ?? null;
    },
  },

  onTileTap(x, y, tiles, gridSize, modeState): TapResult | null {
    const world = (modeState?.world as number) ?? 1;
    const minGroupSize = world <= 2 ? 3 : 4;
    const features = modeState?.features as
      | { wildcards?: boolean; bombs?: boolean; comboChain?: boolean; rain?: boolean }
      | undefined;
    const gcols = (modeState?.gridCols as number) ?? gridSize;
    const grows = (modeState?.gridRows as number) ?? gridSize;

    // Find group with or without wildcards
    let group: Tile[];
    if (features?.wildcards) {
      group = findGroupWithWildcards(x, y, tiles);
    } else {
      const map = buildTileMap(tiles);
      const startTile = map.get(`${x},${y}`);
      const targetSym = startTile?.displayData?.symbol;
      group = findGroup(x, y, tiles, (tile) => tile.displayData?.symbol === targetSym);
    }
    if (group.length < 2) return null;

    // Setup symbol unlock state
    const unlockState: SymbolUnlockState =
      modeState?.lockedSymbols != null
        ? {
            lockedSymbols: modeState.lockedSymbols as string[],
            freshSymbols: (modeState.freshSymbols as string[]) ?? [],
          }
        : { lockedSymbols: [...CANDY_BONUS_SYMBOLS], freshSymbols: [] };

    // Calculate score multiplier and base score
    const clearedSymbol = group[0].displayData?.symbol as string;
    const isFreshClear = unlockState.freshSymbols.includes(clearedSymbol);
    const scoreMultiplier = isFreshClear ? 2 : 1;

    // Apply bomb explosion if enabled
    const { extraClearedKeys, bonusScore } = features?.bombs
      ? applyBombExplosion(group, tiles, gridSize)
      : { extraClearedKeys: new Set<string>(), bonusScore: 0 };

    // Setup combo chain
    const prevCombo: ComboState =
      features?.comboChain && modeState?.combo ? (modeState.combo as ComboState) : resetCombo();
    const newCombo = features?.comboChain ? updateCombo(prevCombo, group.length) : resetCombo();
    const comboMult = features?.comboChain ? newCombo.multiplier : 1;

    // Calculate score
    const scoreDelta = calculateCandyScore(group.length, scoreMultiplier, comboMult, bonusScore);

    // Process tile clearing, gravity, and freshness updates
    const {
      tiles: nextTiles,
      unlockState: newUnlockState,
      newSymbolUnlocked,
    } = processCandyClear(group, tiles, extraClearedKeys, features, gcols, grows, unlockState);

    // Unfreeze nearby frozen tiles
    const { tiles: remainingWithUnfrozen } = unblockNearGroup(
      group,
      nextTiles,
      'frozen',
      minGroupSize
    );

    // Calculate time bonus
    const timeLeft = modeState?.timeLeft as number | undefined;
    const timeBonus = calculateCandyTimeBonus(group.length, timeLeft, features);

    return {
      tiles: remainingWithUnfrozen,
      valid: true,
      scoreDelta,
      timeBonus,
      customState: {
        ...(modeState as Record<string, unknown>),
        iceWarning: undefined,
        lockedSymbols: newUnlockState.lockedSymbols,
        freshSymbols: newUnlockState.freshSymbols,
        newSymbolUnlocked,
        freshClear: isFreshClear ? clearedSymbol : undefined,
        combo: newCombo,
      },
    };
  },

  // ── onTick feature handlers ──────────────────────────────────────────────
  // These helpers reduce the cognitive complexity of the tick method

  onTick(state, modeState) {
    const timeLeft = modeState?.timeLeft as number | undefined;
    const world = (modeState?.world as number) ?? 0;
    const features = modeState?.features as any;

    let updatedState: Record<string, unknown> | null = null;
    let updatedTiles = state.tiles;

    // Apply rain feature if enabled
    if (features?.rain) {
      const rainResult = processCandyRain(updatedTiles, state);
      updatedTiles = rainResult.updatedTiles;
      updatedState = rainResult.updatedState;
    }

    // Apply tropical ice feature if enabled
    if (features?.ice) {
      const iceResult = processCandyIce(updatedTiles, state, updatedState);
      updatedTiles = iceResult.updatedTiles;
      updatedState = iceResult.updatedState;
    }

    if (updatedState !== null) return { tiles: updatedTiles, modeState: updatedState };
    if (timeLeft === undefined) return null;

    const freezeCount = getBlockerCount(features, timeLeft);
    if (freezeCount === 0) return null;

    const existingFrozen = getExistingFrozenPositions(state.tiles);
    const maxCount = features?.ice ? freezeCount : getFrozenTileMaxCount(timeLeft);
    const result = spawnBlockers(state.tiles, 'frozen', existingFrozen, {
      spawnChance: 1,
      maxCount,
    });
    if (!result) return null;

    const minGroupSize = getMinGroupSizeForWorld(world);
    return {
      tiles: result.tiles,
      modeState: {
        ...state.modeState,
        iceWarning: `🧊 Ice! Match ${minGroupSize}+ to unfreeze!`,
      },
    };
  },

  checkWin(_tiles, _goalNodes, moves, maxMoves, modeState): WinResult {
    const score = (modeState?.score as number) ?? 0;
    const target = (modeState?.targetScore as number) ?? Infinity;
    if (moves >= maxMoves) return { won: true };
    const won = score >= target;
    return { won, reason: won ? 'Target reached!' : undefined };
  },

  checkLoss(_tiles, _wallOffset, _moves, _maxMoves, _modeState): LossResult {
    return { lost: false };
  },

  getWinTiles(tiles): Set<string> {
    // On win, light up every candy tile
    return new Set(tiles.filter((t) => t.canRotate).map((t) => `${t.x},${t.y}`));
  },

  tutorialSteps: CANDY_TUTORIAL_STEPS,
  renderDemo: renderCandyDemo,

  getNotification(_tiles, _moves, modeState) {
    // Early returns for warnings and special notifications
    const iceWarning = modeState?.iceWarning as string | undefined;
    if (iceWarning) return iceWarning;

    const combo = modeState?.combo as ComboState | undefined;
    if (combo) {
      const cn = comboNotification(combo);
      if (cn) return cn;
    }

    const newSymbol = modeState?.newSymbolUnlocked as string | undefined;
    if (newSymbol) return `✨ NEW! ${newSymbol} unlocked — worth 2× until even!`;

    // Handle score-based notifications
    const delta = (modeState?.scoreDelta as number) ?? 0;
    if (delta <= 0) return null;

    const freshClear = modeState?.freshClear as string | undefined;
    if (freshClear) return `+${delta} 🌟 ${freshClear} FRESH BONUS!`;

    // Derive group size from score formula: n² × 5
    const n = Math.round(Math.sqrt(delta / 5));
    const timeBonus = (modeState?.timeBonus as number) ?? 0;
    const timeLeft = modeState?.timeLeft as number | undefined;

    // Timed mode notifications include time bonus
    if (timeLeft !== undefined && timeBonus > 0) {
      return getTimedNotification(delta, n, timeBonus);
    }

    // Non-timed mode notifications
    return getNonTimedNotification(delta, n);
  },

  statsLabels: { moves: 'TAPS' },
  statsDisplay: [{ type: 'score' }, { type: 'moves' }],
  walkthrough: CANDY_WALKTHROUGH,

  getColorContext: () => getModeColorPalette('candy'),
};
