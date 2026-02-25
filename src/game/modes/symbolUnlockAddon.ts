// SYMBOL UNLOCK ADDON — Introduce new tile types mid-game on big combos.
//
// When a player clears 5+ connected tiles, the next locked symbol is introduced.
// The new symbol spawns as "fresh": it scores 2× until it reaches an even share
// of the board, then graduates to a normal tile.
//
// Usage:
//   import { deriveUnlockState, tryUnlockSymbol, expandActiveSymbols,
//            updateFreshness, applyFreshFlags } from '../symbolUnlockAddon';

import { Tile } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SymbolUnlockState {
  /** Symbols not yet introduced to the board — unlocked one at a time on 5+ combos. */
  lockedSymbols: string[];
  /** Recently unlocked symbols — score 2× until evenly distributed on the board. */
  freshSymbols: string[];
}

// ── State helpers ─────────────────────────────────────────────────────────────

/**
 * Derive initial unlock state by comparing what's already in the tiles
 * against the full master symbol list.
 */
export function deriveUnlockState(tiles: Tile[], allSymbols: string[]): SymbolUnlockState {
  const activeSymbols =
    (tiles.find((t) => t.canRotate)?.displayData?.activeSymbols as string[]) ?? allSymbols;
  const activeSet = new Set(activeSymbols);
  return {
    lockedSymbols: allSymbols.filter((s) => !activeSet.has(s)),
    freshSymbols: [],
  };
}

// ── Core operations ───────────────────────────────────────────────────────────

/**
 * Pop the next locked symbol and mark it as fresh.
 * Returns the new symbol + updated state, or null if nothing is locked.
 */
export function tryUnlockSymbol(
  state: SymbolUnlockState
): { symbol: string; state: SymbolUnlockState } | null {
  if (!state.lockedSymbols.length) return null;
  const [symbol, ...rest] = state.lockedSymbols;
  return {
    symbol,
    state: {
      lockedSymbols: rest,
      freshSymbols: [...state.freshSymbols, symbol],
    },
  };
}

/**
 * Add a new symbol to the `activeSymbols` list embedded in every tile's
 * displayData so that `applyGravity` will start spawning it on refill.
 * Must be called on `remaining` tiles BEFORE gravity is applied.
 */
export function expandActiveSymbols(tiles: Tile[], newSymbol: string): Tile[] {
  return tiles.map((t) => {
    const current = t.displayData?.activeSymbols as string[] | undefined;
    if (!current || current.includes(newSymbol)) return t;
    return { ...t, displayData: { ...t.displayData, activeSymbols: [...current, newSymbol] } };
  });
}

/**
 * Graduate fresh symbols that have reached an even share of the board.
 * "Even" = the symbol's tile count is ≥ 80 % of (totalActive / numSymbols).
 */
export function updateFreshness(tiles: Tile[], state: SymbolUnlockState): SymbolUnlockState {
  if (!state.freshSymbols.length) return state;
  const active = tiles.filter((t) => t.canRotate);
  if (!active.length) return state;
  const numSymbols = (active[0].displayData?.activeSymbols as string[] ?? []).length || 1;
  const evenShare = active.length / numSymbols;
  const stillFresh = state.freshSymbols.filter((sym) => {
    const count = active.filter((t) => t.displayData?.symbol === sym).length;
    return count < evenShare * 0.8;
  });
  return { ...state, freshSymbols: stillFresh };
}

/**
 * Stamp `displayData.isFresh` on every active tile so the tile renderer can
 * apply a golden glow without needing access to mode state.
 * Only creates new tile objects for tiles whose flag actually changes.
 */
export function applyFreshFlags(tiles: Tile[], freshSymbols: string[]): Tile[] {
  const freshSet = new Set(freshSymbols);
  return tiles.map((t) => {
    if (!t.canRotate) return t;
    const sym = t.displayData?.symbol as string;
    const shouldBeFresh = freshSet.has(sym);
    const isFresh = !!(t.displayData as Record<string, unknown>)?.isFresh;
    if (shouldBeFresh === isFresh) return t;
    return { ...t, displayData: { ...t.displayData, isFresh: shouldBeFresh } };
  });
}
