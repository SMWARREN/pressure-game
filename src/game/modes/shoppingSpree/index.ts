// SHOPPING SPREE MODE — Match Items & Earn Money!
//
// Tap a connected group of 2+ same items to "buy" them and earn cash.
// Different items have different values: 💄=10, 👗=15, 👠=20, 👜=25, 💎=50
// Bigger groups = bonus multipliers! Score = (itemValue × groupSize) × comboMultiplier
//
// UNIQUE MECHANICS:
// 🎫 Coupon Tiles - Match adjacent to coupons for 2× bonus!
// ⚡ Flash Sales - Random item gets 3× value for next 3 taps!
// 🛒 Shopping Cart - Build up cart bonus for mega rewards!
// 🦹 Thief - In Unlimited mode, thieves steal items! Can't tap while thief is there!
//
// Win: reach targetScore within maxMoves. Loss: moves exhausted without hitting target.

import { GameModeConfig, TapResult, WinResult, LossResult } from '../types';
import { Tile } from '../../types';
import { SHOPPING_LEVELS, SHOPPING_WORLDS, SHOPPING_ITEMS, ITEM_VALUES } from './levels';
import { SHOPPING_SPREE_TUTORIAL_STEPS } from './tutorial';
import { renderShoppingSpreeDemo } from './demo';
import { SHOPPING_SPREE_WALKTHROUGH } from './walkthrough';
import { spawnBlockers, unblockNearGroup } from '../blockingAddon';
import { getBlockerCount, getMinGroupForTime } from '../unlimitedBlockerAddon';
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

// ── Mode State for Flash Sales, Cart, Thief & Symbol Unlock ──────────────────

interface ShoppingModeState extends Record<string, unknown> {
  flashSaleItem: string | null;
  flashSaleTapsLeft: number;
  cartItems: number;
  cartBonus: number;
  lastGroupSize: number;
  thiefPositions: string[];
  thiefWarning?: string;
  // Symbol unlock
  lockedSymbols?: string[];
  freshSymbols?: string[];
  newSymbolUnlocked?: string;
  freshClear?: string;
  // Combo chain
  combo?: ComboState;
  // Rain
  lastRainAt?: number;
  lastThiefAt?: number;
}

function getInitialState(): ShoppingModeState {
  return {
    flashSaleItem: null,
    flashSaleTapsLeft: 0,
    cartItems: 0,
    cartBonus: 0,
    lastGroupSize: 0,
    thiefPositions: [],
  };
}

// ── Flash Sale System ─────────────────────────────────────────────────────────

function maybeTriggerFlashSale(state: ShoppingModeState): ShoppingModeState {
  // 15% chance to trigger a flash sale after each move
  if (Math.random() > 0.15) return state;

  // Pick a random common item (not 💎)
  const commonItems = SHOPPING_ITEMS.filter((s) => s !== '💎');
  const saleItem = commonItems[Math.floor(Math.random() * commonItems.length)];

  return {
    ...state,
    flashSaleItem: saleItem,
    flashSaleTapsLeft: 3, // Sale lasts 3 taps
  };
}

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
 * and fill the top with fresh random items.
 */
function applyGravity(
  tiles: Tile[],
  gridCols: number,
  gridRows: number,
  features?: { wildcards?: boolean; bombs?: boolean }
): Tile[] {
  const survivors = tiles.filter((t) => t.canRotate);
  const activeSymbols = (survivors.find((t) => t.canRotate)?.displayData
    ?.activeSymbols as string[]) ?? [...SHOPPING_ITEMS];

  const result: Tile[] = [];

  for (let col = 0; col < gridCols; col++) {
    const colTiles = survivors.filter((t) => t.x === col).sort((a, b) => b.y - a.y);

    // Pack existing tiles to the bottom
    for (let i = 0; i < colTiles.length; i++) {
      const d = colTiles[i].displayData ?? {};
      result.push({
        ...colTiles[i],
        y: gridRows - 1 - i,
        justRotated: false,
        displayData: { ...d, isNew: false },
      });
    }

    // Fill remaining slots from the top with new random items
    const fillCount = gridRows - colTiles.length;
    for (let row = 0; row < fillCount; row++) {
      const roll = Math.random();
      if (features?.bombs && roll < 0.03) {
        result.push(makeBombTile(col, row, activeSymbols));
      } else if (features?.wildcards && roll < 0.08) {
        result.push(makeWildcardTile(col, row, activeSymbols));
      } else {
        let symbol: string;
        if (Math.random() < 0.1) {
          symbol = '💎';
        } else {
          const commonSymbols = activeSymbols.filter((s) => s !== '💎');
          symbol = commonSymbols[Math.floor(Math.random() * commonSymbols.length)];
        }
        result.push({
          id: `sn-${col}-${row}-${Math.random().toString(36).slice(2, 7)}`,
          type: 'path' as const,
          x: col,
          y: row,
          connections: [],
          canRotate: true,
          isGoalNode: false,
          justRotated: true,
          displayData: { symbol, activeSymbols: activeSymbols, isNew: true },
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
  const itemTiles = tiles.filter((t) => t.canRotate);
  const symbols = itemTiles.map((t) => t.displayData?.symbol as string);
  for (let i = symbols.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
  }
  let idx = 0;
  return tiles.map((t) =>
    t.canRotate ? { ...t, displayData: { ...t.displayData, symbol: symbols[idx++] } } : t
  );
}

// ── Per-item color palette ────────────────────────────────────────────────────

const ITEM_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  // Base items
  '👗': { bg: '#2d1a2d', border: '#ec4899', glow: 'rgba(236,72,153,0.5)' }, // Pink dress
  '👠': { bg: '#2d1a1a', border: '#ef4444', glow: 'rgba(239,68,68,0.5)' }, // Red heels
  '👜': { bg: '#2d2418', border: '#d97706', glow: 'rgba(217,119,6,0.5)' }, // Brown bag
  '💄': { bg: '#2d0f1f', border: '#db2777', glow: 'rgba(219,39,119,0.5)' }, // Magenta lipstick
  '💎': { bg: '#0f1f2d', border: '#06b6d4', glow: 'rgba(6,182,212,0.6)' }, // Cyan diamond
  // Bonus items — unlocked mid-game via 5+ combos
  '🎀': { bg: '#2d0f20', border: '#f472b6', glow: 'rgba(244,114,182,0.5)' }, // Ribbon $20
  '👒': { bg: '#2d1d0a', border: '#ca8a04', glow: 'rgba(202,138,4,0.5)' }, // Sun hat $25
  '🧣': { bg: '#0a2020', border: '#0d9488', glow: 'rgba(13,148,136,0.5)' }, // Scarf $30
  '💍': { bg: '#1a1505', border: '#d4af37', glow: 'rgba(212,175,55,0.6)' }, // Ring $45
  '🧥': { bg: '#0a0f20', border: '#3b82f6', glow: 'rgba(59,130,246,0.5)' }, // Coat $35
  '🕶️': { bg: '#151515', border: '#94a3b8', glow: 'rgba(148,163,184,0.5)' }, // Sunglasses $25
};

// Bonus items not in the base pool — unlocked one at a time via 5+ combos.
// Values are defined in ITEM_VALUES (imported from levels) but extras live here.
const SHOPPING_BONUS_ITEMS = ['🎀', '👒', '🧣', '💍', '🧥', '🕶️'];
const BONUS_ITEM_VALUES: Record<string, number> = {
  '🎀': 20,
  '👒': 25,
  '🧣': 30,
  '💍': 45,
  '🧥': 35,
  '🕶️': 25,
};

// ── Mode config ───────────────────────────────────────────────────────────────

export const ShoppingSpreeMode: GameModeConfig = {
  id: 'shoppingSpree',
  name: 'Shopping Spree',
  description: 'Match items to shop and earn cash! Different items have different values.',
  icon: '🛍️',
  color: '#ec4899',
  wallCompression: 'never',
  supportsUndo: false,
  useMoveLimit: true,
  getLevels: () => SHOPPING_LEVELS,
  worlds: SHOPPING_WORLDS,
  supportsWorkshop: false,
  overlayText: { win: 'GOAL REACHED!', loss: 'OUT OF TAPS!' },

  tileRenderer: {
    type: 'shopping',
    hidePipes: true,
    symbolSize: '1.5rem',

    getColors(tile, _ctx) {
      if (isWildcard(tile)) return getWildcardColors(tile);
      if (isBomb(tile)) return getBombColors(tile);

      // Thief tile — dark red ominous styling
      if (tile.displayData?.hasThief) {
        return {
          background: 'linear-gradient(145deg, #2d0a0a 0%, #1a0505 100%)',
          border: '2px solid #ef4444',
          boxShadow: '0 0 16px rgba(239,68,68,0.6), 0 0 4px rgba(239,68,68,0.3)',
        };
      }

      if (!tile.canRotate) {
        return { background: 'rgba(10,10,20,0)', border: '1px solid transparent' };
      }

      const sym = tile.displayData?.symbol as string;
      const c = ITEM_COLORS[sym] ?? {
        bg: '#1a1a2e',
        border: '#ec4899',
        glow: 'rgba(236,72,153,0.4)',
      };

      // Fresh (newly unlocked) item — golden glow, worth 2×
      if (tile.displayData?.isFresh) {
        return {
          background: `linear-gradient(145deg, ${c.bg} 0%, ${c.bg}cc 100%)`,
          border: '2px solid #fbbf24',
          boxShadow: '0 0 18px rgba(251,191,36,0.7), 0 0 6px rgba(251,191,36,0.4)',
        };
      }

      // New tiles get a bright pink glow
      if (tile.displayData?.isNew) {
        return {
          background: `linear-gradient(145deg, ${c.bg} 0%, ${c.bg}bb 100%)`,
          border: '2px solid #f9a8d4',
          boxShadow: '0 0 18px rgba(249,168,212,0.75), 0 0 6px rgba(249,168,212,0.4)',
        };
      }

      return {
        background: `linear-gradient(145deg, ${c.bg} 0%, ${c.bg}bb 100%)`,
        border: `2px solid ${c.border}`,
        boxShadow: `0 0 8px ${c.glow}`,
      };
    },

    getSymbol(tile) {
      if (isWildcard(tile)) return WILDCARD_SYMBOL;
      if (isBomb(tile)) return BOMB_SYMBOL;
      // Show thief emoji on thief tiles
      if (tile.displayData?.hasThief) return '🦹';
      if (!tile.canRotate) return null;
      return (tile.displayData?.symbol as string) ?? null;
    },
  },

  initialState: () => getInitialState(),

  onTick(state, modeState) {
    const timeLeft = modeState?.timeLeft as number | undefined;
    const world = (modeState?.world as number) ?? 4;
    const features = modeState?.features as
      | { rain?: boolean; thieves?: boolean; blockerIntensity?: 0 | 1 | 2 }
      | undefined;

    const storedState = (state.modeState as ShoppingModeState) || getInitialState();

    // Accumulate tile/state changes so rain + thieves can both fire in the same tick
    let updatedState: ShoppingModeState | null = null;
    let updatedTiles = state.tiles;

    // ── Rain — scramble 2-3 tiles every 10s on Black Friday levels ───────────
    if (features?.rain) {
      const activeSymbols = (updatedTiles.find((t) => t.canRotate)?.displayData
        ?.activeSymbols as string[]) ?? [...SHOPPING_ITEMS];
      const lastRainAt = storedState.lastRainAt ?? 0;
      const rainResult = tickRain(
        updatedTiles,
        state.elapsedSeconds,
        lastRainAt,
        activeSymbols,
        state.currentLevel?.gridSize ?? 9
      );
      if (rainResult) {
        updatedTiles = rainResult.tiles;
        updatedState = { ...(updatedState ?? storedState), lastRainAt: rainResult.lastRainAt };
      }
    }

    // ── Thieves (Black Friday) — spawn 1 thief every 18s ─────────────────────
    // Uses elapsed time so it works on move-limited levels (no timeLeft needed)
    if (features?.thieves) {
      const base = updatedState ?? storedState;
      const lastThiefAt = base.lastThiefAt ?? 0;
      if (state.elapsedSeconds >= 10 && state.elapsedSeconds - lastThiefAt >= 18) {
        const existingThieves = new Set(base.thiefPositions || []);
        const thiefResult = spawnBlockers(updatedTiles, 'hasThief', existingThieves, {
          spawnChance: 0.7,
          maxCount: 1,
        });
        if (thiefResult) {
          updatedTiles = thiefResult.tiles;
          updatedState = {
            ...(updatedState ?? storedState),
            lastThiefAt: state.elapsedSeconds,
            thiefPositions: [...existingThieves, ...thiefResult.newPositions],
            thiefWarning: `🦹 THIEF! Match 4+ to scare away!`,
          };
        }
      }
    }

    if (updatedState !== null) return { tiles: updatedTiles, modeState: updatedState };

    // Only run time-based thief spawning on Unlimited world with config-driven thieves
    if (!features?.thieves || timeLeft === undefined) return null;

    // Use config-driven approach: blockerIntensity determines spawn behavior
    const count = getBlockerCount(features, timeLeft);
    if (count === 0) return null;

    // Determine spawn chance based on intensity
    let spawnChance = 0;
    const intensity = features.blockerIntensity ?? 0;
    if (intensity === 1) {
      // Moderate: thieves in last 20s
      if (timeLeft < 10) spawnChance = 0.4;
      else if (timeLeft < 20) spawnChance = 0.25;
      else if (timeLeft < 25) spawnChance = 0.15;
    } else if (intensity === 2) {
      // Aggressive: thieves throughout
      if (timeLeft < 10) spawnChance = 0.55;
      else if (timeLeft < 20) spawnChance = 0.4;
      else if (timeLeft < 30) spawnChance = 0.25;
      else spawnChance = 0.15;
    }

    if (spawnChance === 0) return null;

    const existingThieves = new Set(storedState.thiefPositions || []);
    const result = spawnBlockers(updatedTiles, 'hasThief', existingThieves, {
      spawnChance,
      maxCount: count,
    });
    if (!result) return null;

    const minGroupSize = world <= 2 ? 3 : 4;
    return {
      tiles: result.tiles,
      modeState: {
        ...storedState,
        thiefPositions: [...existingThieves, ...result.newPositions],
        thiefWarning: `🦹 THIEF! Match ${minGroupSize}+ to scare away!`,
      },
    };
  },

  onTileTap(x, y, tiles, gridSize, modeState): TapResult | null {
    const state: ShoppingModeState = (modeState as ShoppingModeState) || getInitialState();
    const world = (modeState?.world as number) ?? 4;
    const minGroupSize = world <= 2 ? 3 : 4;
    const features = modeState?.features as
      | { wildcards?: boolean; bombs?: boolean; comboChain?: boolean; rain?: boolean }
      | undefined;
    const gcols = (modeState?.gridCols as number) ?? gridSize;
    const grows = (modeState?.gridRows as number) ?? gridSize;

    // Check if this tile has a thief - can't tap!
    const tileKey = `${x},${y}`;
    if (state.thiefPositions?.includes(tileKey)) {
      return { tiles, valid: false, scoreDelta: 0, customState: state };
    }

    const group = features?.wildcards
      ? findGroupWithWildcards(x, y, tiles)
      : findGroup(x, y, tiles);
    if (group.length < 2) return null; // Need 2+ connected same-item tiles

    // ── Symbol unlock state ────────────────────────────────────────────────────
    const unlockState: SymbolUnlockState =
      state.lockedSymbols != null
        ? { lockedSymbols: state.lockedSymbols, freshSymbols: state.freshSymbols ?? [] }
        : { lockedSymbols: [...SHOPPING_BONUS_ITEMS], freshSymbols: [] };

    // Get the item type and its value (bonus items use BONUS_ITEM_VALUES)
    const symbol = group[0].displayData?.symbol as string;
    let baseValue = ITEM_VALUES[symbol] ?? BONUS_ITEM_VALUES[symbol] ?? 10;

    // ⚡ FLASH SALE BONUS - 3× value if this item is on sale!
    if (state.flashSaleItem === symbol && state.flashSaleTapsLeft > 0) {
      baseValue *= 3;
    }

    // 🌟 FRESH BONUS - 2× value for newly unlocked items until evenly spread!
    const isFreshClear = unlockState.freshSymbols.includes(symbol);
    if (isFreshClear) baseValue *= 2;

    // Calculate score: base value × group size × combo multiplier
    let comboMultiplier = 1;
    if (group.length >= 5) comboMultiplier = 2;
    if (group.length >= 7) comboMultiplier = 3;
    if (group.length >= 10) comboMultiplier = 4;

    // ── Bomb explosion ─────────────────────────────────────────────────────────
    const { extraClearedKeys, bonusScore } = features?.bombs
      ? applyBombExplosion(group, tiles, gridSize)
      : { extraClearedKeys: new Set<string>(), bonusScore: 0 };

    // ── Combo chain multiplier ─────────────────────────────────────────────────
    const prevCombo: ComboState = features?.comboChain && state.combo ? state.combo : resetCombo();
    const newCombo = features?.comboChain ? updateCombo(prevCombo, group.length) : resetCombo();
    const comboChainMult = features?.comboChain ? newCombo.multiplier : 1;

    let scoreDelta =
      Math.round(baseValue * group.length * comboMultiplier * comboChainMult) + bonusScore;

    // 🛒 SHOPPING CART BONUS - Every 10 items = bonus $50!
    const newCartItems = state.cartItems + group.length;
    let cartBonus = 0;
    if (Math.floor(newCartItems / 10) > Math.floor(state.cartItems / 10)) {
      cartBonus = 50;
      scoreDelta += cartBonus;
    }

    const clearedKeys = new Set([...group.map((t) => `${t.x},${t.y}`), ...extraClearedKeys]);
    let remaining = tiles.filter((t) => !clearedKeys.has(`${t.x},${t.y}`));

    // 5+ combo → unlock the next bonus item!
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

    // 🦹 THIEF SCARING — threshold and radius scale with world difficulty
    const { tiles: remainingWithThiefClear, unblocked: scaredThiefKeys } = unblockNearGroup(
      group,
      remaining,
      'hasThief',
      minGroupSize
    );
    const thiefScared = scaredThiefKeys.size > 0;
    const newThiefPositions = (state.thiefPositions || []).filter(
      (pos) => !scaredThiefKeys.has(pos)
    );

    let next = applyGravity(remainingWithThiefClear, gcols, grows, features);

    // If refill produces a deadlock, reshuffle
    if (!hasValidMove(next)) {
      next = reshuffle(next);
    }

    // Graduate fresh items that are now evenly distributed, then stamp flags
    newUnlockState = updateFreshness(next, newUnlockState);
    next = applyFreshFlags(next, newUnlockState.freshSymbols);

    // Tick down flash sale on every tap (not just matching taps)
    const newFlashSaleTapsLeft = state.flashSaleTapsLeft > 0 ? state.flashSaleTapsLeft - 1 : 0;
    const newFlashSaleItem = newFlashSaleTapsLeft <= 0 ? null : state.flashSaleItem;

    // Update mode state
    let newState: ShoppingModeState = {
      ...state,
      cartItems: newCartItems,
      cartBonus: cartBonus,
      lastGroupSize: group.length,
      scoreDelta,
      flashSaleTapsLeft: newFlashSaleTapsLeft,
      flashSaleItem: newFlashSaleItem,
      thiefPositions: newThiefPositions,
      thiefWarning: thiefScared ? undefined : state.thiefWarning,
      lockedSymbols: newUnlockState.lockedSymbols,
      freshSymbols: newUnlockState.freshSymbols,
      newSymbolUnlocked,
      freshClear: isFreshClear ? symbol : undefined,
      combo: newCombo,
    };

    // Maybe trigger a new flash sale
    if (!newState.flashSaleItem) {
      newState = maybeTriggerFlashSale(newState);
    }

    // Time bonus for Unlimited world (world 4) — bigger groups = more time!
    const timeLeft = modeState?.timeLeft as number | undefined;
    let timeBonus = 0;
    if (timeLeft !== undefined) {
      const minGroupForTime = getMinGroupForTime(features);

      if (group.length >= minGroupForTime) {
        if (group.length >= 10) timeBonus = 8;
        else if (group.length >= 7) timeBonus = 5;
        else if (group.length >= 5) timeBonus = 3;
        else if (group.length >= 4) timeBonus = 2;
        else if (group.length >= 3) timeBonus = 2;
        else if (group.length >= 2) timeBonus = 1;
      }
    }

    return { tiles: next, valid: true, scoreDelta, customState: newState, timeBonus };
  },

  checkWin(_tiles, _goalNodes, moves, maxMoves, modeState): WinResult {
    const score = (modeState?.score as number) ?? 0;
    const target = (modeState?.targetScore as number) ?? Infinity;
    if (moves >= maxMoves) return { won: true };
    const won = score >= target;
    return { won, reason: won ? 'Shopping goal reached!' : undefined };
  },

  checkLoss(_tiles, _wallOffset, _moves, _maxMoves, _modeState): LossResult {
    return { lost: false };
  },

  getWinTiles(tiles): Set<string> {
    // On win, light up every item tile
    return new Set(tiles.filter((t) => t.canRotate).map((t) => `${t.x},${t.y}`));
  },

  tutorialSteps: SHOPPING_SPREE_TUTORIAL_STEPS,
  renderDemo: renderShoppingSpreeDemo,
  walkthrough: SHOPPING_SPREE_WALKTHROUGH,

  getNotification(_tiles, _moves, modeState) {
    const state = (modeState as ShoppingModeState) || getInitialState();
    const delta = (modeState?.scoreDelta as number) ?? 0;
    const timeBonus = (modeState?.timeBonus as number) ?? 0;
    const timeLeft = modeState?.timeLeft as number | undefined;

    // Combo chain notification (Black Friday levels)
    if (state.combo) {
      const cn = comboNotification(state.combo);
      if (cn) return cn;
    }

    // New bonus item unlocked
    if (state.newSymbolUnlocked) {
      const val = BONUS_ITEM_VALUES[state.newSymbolUnlocked] ?? '?';
      return `✨ NEW! ${state.newSymbolUnlocked} $${val} — worth 2× until even!`;
    }

    // Cleared a fresh item
    if (state.freshClear && delta > 0) {
      return `+$${delta} 🌟 ${state.freshClear} FRESH BONUS!`;
    }

    // Thief warning announcement
    if (state.thiefWarning) {
      return state.thiefWarning;
    }

    // Thief scared away notification
    if (modeState?.thiefScared) {
      return '🦹 Thief scared away!';
    }

    // Flash sale announcement
    if (state.flashSaleItem && state.flashSaleTapsLeft === 3) {
      return `⚡ FLASH SALE! ${state.flashSaleItem} = 3× VALUE!`;
    }

    // Cart bonus notification
    if (state.cartBonus > 0) {
      return `🛒 CART FULL! +$${state.cartBonus} BONUS!`;
    }

    if (delta <= 0) return null;

    // In timed/Unlimited mode, show time bonus
    if (timeLeft !== undefined && timeBonus > 0) {
      if (delta >= 300) return `+$${delta} ⏱️+${timeBonus}s 💎 JACKPOT!`;
      if (delta >= 150) return `+$${delta} ⏱️+${timeBonus}s 🔥 SUPER!`;
      if (delta >= 75) return `+$${delta} ⏱️+${timeBonus}s ✨`;
      return `+$${delta} ⏱️+${timeBonus}s`;
    }

    // Non-timed mode notifications
    if (delta >= 300) return `+$${delta} 💎 JACKPOT!`;
    if (delta >= 150) return `+$${delta} 🔥 SUPER DEAL!`;
    if (delta >= 75) return `+$${delta} ✨ GREAT BUY!`;
    if (delta >= 50) return `+$${delta} 💰 NICE!`;
    return null;
  },

  statsLabels: { moves: 'TAPS' },
  statsDisplay: [{ type: 'score' }, { type: 'moves' }],
};
