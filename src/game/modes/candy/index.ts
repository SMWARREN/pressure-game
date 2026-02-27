// CANDY MODE — Match-3 Group Clear
//
// Tap a connected group of 2+ same-colored candies to clear them.
// Remaining tiles fall (gravity) and new random ones fill from the top.
// Score = n² × 5 per clear (bigger groups = exponentially more points).
// Win: reach targetScore within maxMoves. Loss: moves exhausted without hitting target.
//
// No pipes, no walls — pure match-3 arcade gameplay.

import { GameModeConfig, TapResult, WinResult, LossResult } from '../types';
import { Tile } from '../../types';
import { CANDY_LEVELS, CANDY_WORLDS, CANDY_SYMBOLS } from './levels';
import { CANDY_TUTORIAL_STEPS } from './tutorial';
import { renderCandyDemo } from './demo';
import { CANDY_WALKTHROUGH } from './walkthrough';
import { spawnBlockers, unblockNearGroup } from '../blockingAddon';
import {
  tryUnlockSymbol,
  expandActiveSymbols,
  updateFreshness,
  applyFreshFlags,
  type SymbolUnlockState,
} from '../symbolUnlockAddon';
import { findGroupWithWildcards } from '../arcadeShared';
import { WILDCARD_SYMBOL, isWildcard, makeWildcardTile, getWildcardColors } from '../wildcardAddon';
import { BOMB_SYMBOL, isBomb, makeBombTile, applyBombExplosion, getBombColors } from '../bombAddon';
import { updateCombo, resetCombo, comboNotification, type ComboState } from '../comboChainAddon';
import { tickRain } from '../rainAddon';

// ── Group flood-fill ──────────────────────────────────────────────────────────

function buildMap(tiles: Tile[]): Map<string, Tile> {
  const m = new Map<string, Tile>();
  for (const t of tiles) m.set(`${t.x},${t.y}`, t);
  return m;
}

/** Find the full connected group of same-symbol tiles starting at (x, y). */
function findGroup(x: number, y: number, tiles: Tile[]): Tile[] {
  const map = buildMap(tiles);
  const start = map.get(`${x},${y}`);
  if (!start?.canRotate) return [];

  const targetSym = start.displayData?.symbol as string;
  const visited = new Set<string>();
  const stack: Tile[] = [start];
  const group: Tile[] = [];

  while (stack.length) {
    const cur = stack.pop()!;
    const key = `${cur.x},${cur.y}`;
    if (visited.has(key)) continue;
    visited.add(key);
    group.push(cur);

    for (const [dx, dy] of [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ] as [number, number][]) {
      const nb = map.get(`${cur.x + dx},${cur.y + dy}`);
      if (
        nb?.canRotate &&
        !visited.has(`${nb.x},${nb.y}`) &&
        nb.displayData?.symbol === targetSym
      ) {
        stack.push(nb);
      }
    }
  }
  return group;
}

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
        const symbol = activeSymbols[Math.floor(Math.random() * activeSymbols.length)];
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
  const map = buildMap(tiles);
  for (const t of tiles) {
    if (!t.canRotate) continue;
    const sym = t.displayData?.symbol as string;
    for (const [dx, dy] of [
      [0, 1],
      [1, 0],
    ] as [number, number][]) {
      const nb = map.get(`${t.x + dx},${t.y + dy}`);
      if (nb?.canRotate && nb.displayData?.symbol === sym) return true;
    }
  }
  return false;
}

/** Fisher-Yates shuffle of the symbols while keeping tile positions. */
function reshuffle(tiles: Tile[]): Tile[] {
  const candyTiles = tiles.filter((t) => t.canRotate);
  const symbols = candyTiles.map((t) => t.displayData?.symbol as string);
  for (let i = symbols.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
  }
  let idx = 0;
  return tiles.map((t) =>
    t.canRotate ? { ...t, displayData: { ...t.displayData, symbol: symbols[idx++] } } : t
  );
}

// ── Per-symbol color palette ──────────────────────────────────────────────────

const CANDY_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
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

// Bonus symbols that don't exist in the base pool — unlocked one at a time via 5+ combos.
// Every level starts without these; big combos introduce them as fresh (2× score) tiles.
const CANDY_BONUS_SYMBOLS = ['🍇', '🥝', '🍒', '🥭', '🍑', '🍍'];

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

    getColors(tile, _ctx) {
      if (isWildcard(tile)) return getWildcardColors(tile);
      if (isBomb(tile)) return getBombColors(tile);

      // Fresh (newly unlocked) tile — golden glow, worth 2×
      if (tile.displayData?.isFresh && tile.canRotate) {
        const sym = tile.displayData?.symbol as string;
        const c = CANDY_COLORS[sym] ?? {
          bg: '#1a1a2e',
          border: '#fbbf24',
          glow: 'rgba(251,191,36,0.5)',
        };
        return {
          background: `linear-gradient(145deg, ${c.bg} 0%, ${c.bg}cc 100%)`,
          border: '2px solid #fbbf24',
          boxShadow: '0 0 18px rgba(251,191,36,0.7), 0 0 6px rgba(251,191,36,0.4)',
        };
      }

      // Frozen tile — icy blue styling
      if (tile.displayData?.frozen) {
        return {
          background: 'linear-gradient(145deg, #0f1f3d 0%, #091529 100%)',
          border: '2px solid #60a5fa',
          boxShadow: '0 0 14px rgba(96,165,250,0.45)',
        };
      }

      if (!tile.canRotate) {
        return { background: 'rgba(10,10,20,0)', border: '1px solid transparent' };
      }

      const sym = tile.displayData?.symbol as string;
      const c = CANDY_COLORS[sym] ?? {
        bg: '#1a1a2e',
        border: '#6366f1',
        glow: 'rgba(99,102,241,0.4)',
      };

      // New tiles (just dropped in) get a bright indigo glow that fades out after ~1.5s
      if (tile.displayData?.isNew) {
        return {
          background: `linear-gradient(145deg, ${c.bg} 0%, ${c.bg}bb 100%)`,
          border: '2px solid #a5b4fc',
          boxShadow: '0 0 18px rgba(165,180,252,0.75), 0 0 6px rgba(165,180,252,0.4)',
        };
      }

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

    const group = features?.wildcards
      ? findGroupWithWildcards(x, y, tiles)
      : findGroup(x, y, tiles);
    if (group.length < 2) return null; // Need 2+ connected same-color tiles

    // ── Symbol unlock state (persisted across taps in modeState) ──────────────
    // lockedSymbols comes from the bonus pool — never from the base CANDY_SYMBOLS.
    // Every level starts with all 5 base symbols intact; bonuses are extras.
    const unlockState: SymbolUnlockState =
      modeState?.lockedSymbols != null
        ? {
            lockedSymbols: modeState.lockedSymbols as string[],
            freshSymbols: (modeState.freshSymbols as string[]) ?? [],
          }
        : { lockedSymbols: [...CANDY_BONUS_SYMBOLS], freshSymbols: [] };

    // ── Score — 2× for fresh (newly introduced) symbols ───────────────────────
    const clearedSymbol = group[0].displayData?.symbol as string;
    const isFreshClear = unlockState.freshSymbols.includes(clearedSymbol);
    const scoreMultiplier = isFreshClear ? 2 : 1;

    // ── Bomb explosion — clears 3×3 around each bomb in the group ─────────────
    const { extraClearedKeys, bonusScore } = features?.bombs
      ? applyBombExplosion(group, tiles, gridSize)
      : { extraClearedKeys: new Set<string>(), bonusScore: 0 };

    // ── Combo chain multiplier ─────────────────────────────────────────────────
    const prevCombo: ComboState =
      features?.comboChain && modeState?.combo ? (modeState.combo as ComboState) : resetCombo();
    const newCombo = features?.comboChain ? updateCombo(prevCombo, group.length) : resetCombo();
    const comboMult = features?.comboChain ? newCombo.multiplier : 1;

    const scoreDelta =
      Math.round(group.length * group.length * 5 * scoreMultiplier * comboMult) + bonusScore;

    const clearedKeys = new Set([...group.map((t) => `${t.x},${t.y}`), ...extraClearedKeys]);
    let remaining = tiles.filter((t) => !clearedKeys.has(`${t.x},${t.y}`));

    // ── 5+ combo → unlock the next unseen candy ───────────────────────────────
    let newUnlockState = unlockState;
    let newSymbolUnlocked: string | undefined;
    if (group.length >= 5) {
      const unlock = tryUnlockSymbol(unlockState);
      if (unlock) {
        newSymbolUnlocked = unlock.symbol;
        newUnlockState = unlock.state;
        // Expand activeSymbols on survivors so applyGravity refills with new symbol
        remaining = expandActiveSymbols(remaining, unlock.symbol);
      }
    }

    // Unfreeze nearby frozen tiles — threshold and radius scale with world difficulty
    const { tiles: remainingWithUnfrozen } = unblockNearGroup(
      group,
      remaining,
      'frozen',
      minGroupSize
    );

    let next = applyGravity(remainingWithUnfrozen, gcols, grows, features);

    // If refill produces a deadlock, reshuffle so the player can always move
    if (!hasValidMove(next)) {
      next = reshuffle(next);
    }

    // Graduate fresh symbols that are now evenly spread, then stamp isFresh flags
    newUnlockState = updateFreshness(next, newUnlockState);
    next = applyFreshFlags(next, newUnlockState.freshSymbols);

    // ── Time bonus for Unlimited world (world 5) ──────────────────────────────
    const timeLeft = modeState?.timeLeft as number | undefined;
    const levelId = modeState?.levelId as number | undefined;
    let timeBonus = 0;
    if (timeLeft !== undefined) {
      let minGroupForTime = 4;
      if (levelId === 113) minGroupForTime = 2;
      else if (levelId === 114) minGroupForTime = 3;

      if (group.length >= minGroupForTime) {
        if (group.length >= 7) timeBonus = 5;
        else if (group.length >= 6) timeBonus = 4;
        else if (group.length >= 5) timeBonus = 3;
        else if (group.length >= 4) timeBonus = 2;
        else if (group.length >= 3) timeBonus = 2;
        else if (group.length >= 2) timeBonus = 1;
      }
    }

    return {
      tiles: next,
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

  onTick(state, modeState) {
    const timeLeft = modeState?.timeLeft as number | undefined;
    const levelId = modeState?.levelId as number | undefined;
    const world = (modeState?.world as number) ?? 0;
    const features = modeState?.features as { rain?: boolean } | undefined;

    // ── Rain — scramble 2-3 tiles every 10s on Tropical levels ───────────────
    if (features?.rain) {
      const activeSymbols =
        (state.tiles.find((t) => t.canRotate)?.displayData?.activeSymbols as string[]) ??
        CANDY_SYMBOLS;
      const lastRainAt = (state.modeState?.lastRainAt as number) ?? 0;
      const rainResult = tickRain(
        state.tiles,
        state.elapsedSeconds,
        lastRainAt,
        activeSymbols,
        state.currentLevel?.gridSize ?? 8
      );
      if (rainResult) {
        return {
          tiles: rainResult.tiles,
          modeState: { ...state.modeState, lastRainAt: rainResult.lastRainAt },
        };
      }
    }

    // Only run ice freezing on timed levels
    if (timeLeft === undefined) return null;

    // World 5 (Unlimited) levels: 114, 115 - progressive freezing difficulty!
    // Level 113 is PEACEFUL - no ice cubes!
    const isUnlimitedWithIce = levelId !== undefined && levelId >= 114 && levelId <= 115;

    let freezeCount = 0;
    if (isUnlimitedWithIce) {
      // Progressive difficulty for ice cubes:
      // Level 113 (easiest): freezes only in last 10s, max 1 tile
      // Level 114 (medium): freezes in last 15s, max 2 tiles
      // Level 115 (hardest): freezes in last 20s, max 3 tiles
      if (levelId === 113) {
        freezeCount = timeLeft < 5 ? 1 : timeLeft < 10 ? 1 : 0;
      } else if (levelId === 114) {
        freezeCount = timeLeft < 5 ? 2 : timeLeft < 10 ? 2 : timeLeft < 15 ? 1 : 0;
      } else {
        // Level 115 - most aggressive
        freezeCount = timeLeft < 5 ? 3 : timeLeft < 10 ? 2 : timeLeft < 20 ? 1 : 0;
      }
    } else {
      // World 4 (Frozen): original behavior
      freezeCount = timeLeft <= 8 ? 2 : timeLeft <= 15 ? 1 : 0;
    }

    if (freezeCount === 0) return null;

    const existingFrozen = new Set(
      state.tiles.filter((t) => t.displayData?.frozen).map((t) => `${t.x},${t.y}`)
    );
    const result = spawnBlockers(state.tiles, 'frozen', existingFrozen, {
      spawnChance: 1, // ice always spawns when freezeCount > 0
      maxCount: freezeCount,
    });
    if (!result) return null;
    const minGroupSize = world <= 2 ? 3 : 4;
    return {
      tiles: result.tiles,
      modeState: {
        ...state.modeState,
        iceWarning: `🧊 Ice! Match ${minGroupSize}+ to unfreeze!`,
      },
    };
  },

  checkWin(_tiles, _goalNodes, _moves, _maxMoves, modeState): WinResult {
    const score = (modeState?.score as number) ?? 0;
    const target = (modeState?.targetScore as number) ?? Infinity;
    const won = score >= target;
    return { won, reason: won ? 'Target reached!' : undefined };
  },

  checkLoss(_tiles, _wallOffset, moves, maxMoves, modeState): LossResult {
    const score = (modeState?.score as number) ?? 0;
    const target = (modeState?.targetScore as number) ?? Infinity;
    if (moves >= maxMoves && score < target) {
      return { lost: true, reason: 'Out of moves!' };
    }
    return { lost: false };
  },

  getWinTiles(tiles): Set<string> {
    // On win, light up every candy tile
    return new Set(tiles.filter((t) => t.canRotate).map((t) => `${t.x},${t.y}`));
  },

  tutorialSteps: CANDY_TUTORIAL_STEPS,
  renderDemo: renderCandyDemo,

  getNotification(_tiles, _moves, modeState) {
    const iceWarning = modeState?.iceWarning as string | undefined;
    if (iceWarning) return iceWarning;

    // Combo chain notification (Tropical levels)
    const combo = modeState?.combo as ComboState | undefined;
    if (combo) {
      const cn = comboNotification(combo);
      if (cn) return cn;
    }

    // New symbol just unlocked
    const newSymbol = modeState?.newSymbolUnlocked as string | undefined;
    if (newSymbol) return `✨ NEW! ${newSymbol} unlocked — worth 2× until even!`;

    // Cleared a fresh symbol
    const freshClear = modeState?.freshClear as string | undefined;
    const delta = (modeState?.scoreDelta as number) ?? 0;
    if (freshClear && delta > 0) return `+${delta} 🌟 ${freshClear} FRESH BONUS!`;
    const timeBonus = (modeState?.timeBonus as number) ?? 0;
    const timeLeft = modeState?.timeLeft as number | undefined;

    if (delta <= 0) return null;

    // Derive group size from score formula: n² × 5
    const n = Math.round(Math.sqrt(delta / 5));

    // In timed/Unlimited mode, show time bonus
    if (timeLeft !== undefined && timeBonus > 0) {
      if (n >= 7) return `+${delta} ⏱️+${timeBonus}s 🔥 COMBO!`;
      if (n >= 5) return `+${delta} ⏱️+${timeBonus}s ✨`;
      if (n >= 3) return `+${delta} ⏱️+${timeBonus}s`;
      return `+${delta} ⏱️+${timeBonus}s`;
    }

    // Non-timed mode notifications
    if (n >= 9) return `+${delta} 💥 MEGA COMBO!`;
    if (n >= 6) return `+${delta} 🔥 GREAT!`;
    if (n >= 4) return `+${delta} ✨ NICE!`;
    return null; // plain "+N" shown by GameBoard for small groups
  },

  statsLabels: { moves: 'TAPS' },
  statsDisplay: [{ type: 'score' }, { type: 'moves' }],
  walkthrough: CANDY_WALKTHROUGH,
};
