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
import { Tile, GameState, Level } from '../../types';
import { getMinGroupSizeForWorld } from '../utils';
import { pickRandom, isNotEmpty } from '@/utils/conditionalStyles';
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
import { findGroupWithWildcards, buildTileMap } from '../arcadeShared';
import { reshuffleTiles, hasAdjacentMatch } from '../arcadeUtils';
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
  const saleItem = pickRandom(commonItems);

  return {
    ...state,
    flashSaleItem: saleItem,
    flashSaleTapsLeft: 3, // Sale lasts 3 taps
  };
}

// ── Thief spawn helpers ───────────────────────────────────────────────────────

/**
 * Thief spawn chance lookup by intensity and time bracket.
 * Replaces nested conditionals with table lookup.
 */
const THIEF_SPAWN_CHANCES: Record<number, Array<{ timeThreshold: number; chance: number }>> = {
  1: [
    { timeThreshold: 10, chance: 0.4 },
    { timeThreshold: 20, chance: 0.25 },
    { timeThreshold: 25, chance: 0.15 },
  ],
  2: [
    { timeThreshold: 10, chance: 0.55 },
    { timeThreshold: 20, chance: 0.4 },
    { timeThreshold: 30, chance: 0.25 },
    { timeThreshold: Infinity, chance: 0.15 },
  ],
};

function getThiefSpawnChance(intensity: number, timeLeft: number): number {
  const rules = THIEF_SPAWN_CHANCES[intensity];
  if (!rules) return 0;

  for (const rule of rules) {
    if (timeLeft < rule.timeThreshold) return rule.chance;
  }
  return 0;
}

// ── Group flood-fill ──────────────────────────────────────────────────────────

/** Find the full connected group of same-symbol tiles starting at (x, y). */
function findGroup(x: number, y: number, tiles: Tile[]): Tile[] {
  const map = buildTileMap(tiles);
  const start = map.get(`${x},${y}`);
  if (!start?.canRotate) return [];

  const targetSym = start.displayData?.symbol;
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
// ── Tile creation helpers ───────────────────────────────────────────────────

function createRandomShoppingItem(col: number, row: number, activeSymbols: string[]): Tile {
  const symbol = Math.random() < 0.1 ? '💎' : pickRandom(activeSymbols.filter((s) => s !== '💎'));
  return {
    id: `sn-${col}-${row}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'path' as const,
    x: col,
    y: row,
    connections: [],
    canRotate: true,
    isGoalNode: false,
    justRotated: true,
    displayData: { symbol, activeSymbols, isNew: true },
  };
}

function fillColumn(
  col: number,
  colTiles: Tile[],
  gridRows: number,
  activeSymbols: string[],
  features?: { wildcards?: boolean; bombs?: boolean }
): Tile[] {
  const filled: Tile[] = [];

  // Pack existing tiles to the bottom
  for (let i = 0; i < colTiles.length; i++) {
    const d = colTiles[i].displayData ?? {};
    filled.push({
      ...colTiles[i],
      y: gridRows - 1 - i,
      justRotated: false,
      displayData: { ...d, isNew: false },
    });
  }

  // Fill remaining slots with new random items
  const fillCount = gridRows - colTiles.length;
  for (let row = 0; row < fillCount; row++) {
    const roll = Math.random();
    if (features?.bombs && roll < 0.03) {
      filled.push(makeBombTile(col, row, activeSymbols));
    } else if (features?.wildcards && roll < 0.08) {
      filled.push(makeWildcardTile(col, row, activeSymbols));
    } else {
      filled.push(createRandomShoppingItem(col, row, activeSymbols));
    }
  }

  return filled;
}

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
    const filledCol = fillColumn(col, colTiles, gridRows, activeSymbols, features);
    result.push(...filledCol);
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

// ── Score calculation helpers ────────────────────────────────────────────────

/**
 * Calculate the base item value with any applicable bonuses.
 */
function calculateBaseValue(
  symbol: string,
  flashSaleItem: string | null,
  flashSaleTapsLeft: number,
  isFreshClear: boolean
): number {
  let value = ITEM_VALUES[symbol] ?? BONUS_ITEM_VALUES[symbol] ?? 10;
  if (flashSaleItem === symbol && flashSaleTapsLeft > 0) value *= 3; // ⚡ Flash sale
  if (isFreshClear) value *= 2; // 🌟 Fresh bonus
  return value;
}

/**
 * Combo multiplier by group size tiers.
 */
const COMBO_MULTIPLIER_TIERS: Array<{ minSize: number; multiplier: number }> = [
  { minSize: 10, multiplier: 4 },
  { minSize: 7, multiplier: 3 },
  { minSize: 5, multiplier: 2 },
  { minSize: 0, multiplier: 1 },
];

/**
 * Get the combo multiplier based on group size.
 */
function getComboMultiplier(groupSize: number): number {
  for (const tier of COMBO_MULTIPLIER_TIERS) {
    if (groupSize >= tier.minSize) return tier.multiplier;
  }
  return 1;
}

/**
 * Calculate cart bonus from item count milestone.
 */
function calculateCartBonus(currentCartItems: number, newCartItems: number): number {
  return Math.floor(newCartItems / 10) > Math.floor(currentCartItems / 10) ? 50 : 0;
}

/**
 * Calculate total score delta from all sources.
 */
function calculateScoreDelta(
  baseValue: number,
  groupSize: number,
  comboMultiplier: number,
  comboChainMult: number,
  bonusScore: number,
  cartBonus: number
): number {
  return (
    Math.round(baseValue * groupSize * comboMultiplier * comboChainMult) + bonusScore + cartBonus
  );
}

/**
 * Process rain effects on tick
 */
function processRainTick(
  updatedTiles: Tile[],
  state: GameState,
  storedState: ShoppingModeState
): { tiles: Tile[]; newState: ShoppingModeState | null } {
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
  if (!rainResult) return { tiles: updatedTiles, newState: null };
  return {
    tiles: rainResult.tiles,
    newState: { ...storedState, lastRainAt: rainResult.lastRainAt },
  };
}

/**
 * Process thief spawning on tick (Black Friday elapsed time)
 */
function processThiefTick(
  updatedTiles: Tile[],
  state: GameState,
  storedState: ShoppingModeState
): { tiles: Tile[]; newState: ShoppingModeState | null } {
  const lastThiefAt = storedState.lastThiefAt ?? 0;
  if (state.elapsedSeconds < 10 || state.elapsedSeconds - lastThiefAt < 18) {
    return { tiles: updatedTiles, newState: null };
  }
  const existingThieves = new Set(storedState.thiefPositions || []);
  const thiefResult = spawnBlockers(updatedTiles, 'hasThief', existingThieves, {
    spawnChance: 0.7,
    maxCount: 1,
  });
  if (!thiefResult) return { tiles: updatedTiles, newState: null };
  return {
    tiles: thiefResult.tiles,
    newState: {
      ...storedState,
      lastThiefAt: state.elapsedSeconds,
      thiefPositions: [...existingThieves, ...thiefResult.newPositions],
      thiefWarning: `🦹 THIEF! Match 4+ to scare away!`,
    },
  };
}

/**
 * Process time-based thief spawning (Unlimited world)
 */
function processUnlimitedThiefTick(
  state: GameState,
  modeState: Record<string, unknown>,
  storedState: ShoppingModeState,
  features: Level['features'] | undefined
): { tiles: Tile[]; modeState: ShoppingModeState } | null {
  const timeLeft = modeState?.timeLeft as number | undefined;
  if (timeLeft === undefined) return null;
  const count = getBlockerCount(features, timeLeft);
  if (count === 0) return null;
  const intensity = (features?.blockerIntensity as number | undefined) ?? 0;
  const spawnChance = getThiefSpawnChance(intensity, timeLeft);
  if (spawnChance === 0) return null;
  const existingThieves = new Set(storedState.thiefPositions || []);
  const result = spawnBlockers(state.tiles, 'hasThief', existingThieves, {
    spawnChance,
    maxCount: count,
  });
  if (!result) return null;
  const world = (modeState?.world as number) ?? 4;
  const minGroupSize = getMinGroupSizeForWorld(world);
  return {
    tiles: result.tiles,
    modeState: {
      ...storedState,
      thiefPositions: [...existingThieves, ...result.newPositions],
      thiefWarning: `🦹 THIEF! Match ${minGroupSize}+ to scare away!`,
    },
  };
}

/**
 * Time bonus by group size tiers.
 */
const TIME_BONUS_TIERS: Array<{ minSize: number; bonus: number }> = [
  { minSize: 10, bonus: 8 },
  { minSize: 7, bonus: 5 },
  { minSize: 5, bonus: 3 },
  { minSize: 0, bonus: 2 },
];

/**
 * Get notification for special events (combo, unlock, thief, etc.)
 */
function getEventNotification(
  state: ShoppingModeState,
  modeState: Record<string, unknown>,
  delta: number
): string | null {
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

  return null;
}

/**
 * Get score notification for score changes
 */
function getScoreNotification(
  delta: number,
  timeBonus: number,
  timeLeft: number | undefined
): string | null {
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
  return delta >= 50 ? `+$${delta} 💰 NICE!` : null;
}

/**
 * Calculate time bonus for timed levels.
 */
function calculateTimeBonus(
  groupSize: number,
  timeLeft: number | undefined,
  features: { rain?: boolean; thieves?: boolean; blockerIntensity?: 0 | 1 | 2 } | undefined
): number {
  if (timeLeft === undefined) return 0;
  const minGroupForTime = getMinGroupForTime(features);
  if (groupSize < minGroupForTime) return 0;

  for (const tier of TIME_BONUS_TIERS) {
    if (groupSize >= tier.minSize) return tier.bonus;
  }
  return 0;
}

/**
 * Process tile clearing, gravity, and reshuffle.
 */
function processTileClearing(
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

/**
 * Parameters for building new mode state.
 */
interface BuildModeStateParams {
  readonly state: ShoppingModeState;
  readonly groupSize: number;
  readonly scoreDelta: number;
  readonly newCartItems: number;
  readonly cartBonus: number;
  readonly newFlashSaleTapsLeft: number;
  readonly flashSaleItem: string | null;
  readonly newThiefPositions: string[];
  readonly thiefScared: boolean;
  readonly newUnlockState: SymbolUnlockState;
  readonly newSymbolUnlocked: string | undefined;
  readonly symbol: string;
  readonly isFreshClear: boolean;
  readonly newCombo: ComboState;
}

/**
 * Build new mode state from all calculated values.
 */
function buildNewModeState({
  state,
  groupSize,
  scoreDelta,
  newCartItems,
  cartBonus,
  newFlashSaleTapsLeft,
  flashSaleItem,
  newThiefPositions,
  thiefScared,
  newUnlockState,
  newSymbolUnlocked,
  symbol,
  isFreshClear,
  newCombo,
}: BuildModeStateParams): ShoppingModeState {
  return {
    ...state,
    cartItems: newCartItems,
    cartBonus,
    lastGroupSize: groupSize,
    scoreDelta,
    flashSaleTapsLeft: newFlashSaleTapsLeft,
    flashSaleItem,
    thiefPositions: newThiefPositions,
    thiefWarning: thiefScared ? undefined : state.thiefWarning,
    lockedSymbols: newUnlockState.lockedSymbols,
    freshSymbols: newUnlockState.freshSymbols,
    newSymbolUnlocked,
    freshClear: isFreshClear ? symbol : undefined,
    combo: newCombo,
  };
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

// ── Helper functions for onTileTap (reduce complexity) ──────────────────────

interface ShoppingTapConfig {
  readonly x: number;
  readonly y: number;
  readonly tiles: Tile[];
  readonly gridSize: number;
  readonly state: ShoppingModeState;
  readonly world: number;
  readonly features: Level['features'];
  readonly gcols: number;
  readonly grows: number;
  readonly unlockState: SymbolUnlockState;
  readonly minGroupSize: number;
  readonly timeLeft: number | undefined;
}

function processShoppingTap(config: ShoppingTapConfig): TapResult | null {
  const {
    x,
    y,
    tiles,
    gridSize,
    state,
    world: _world,
    features,
    gcols,
    grows,
    unlockState,
    minGroupSize,
    timeLeft,
  } = config;
  // Validate tap and find group
  const tileKey = `${x},${y}`;
  if (state.thiefPositions?.includes(tileKey)) {
    return { tiles, valid: false, scoreDelta: 0, customState: state };
  }

  const group = features?.wildcards ? findGroupWithWildcards(x, y, tiles) : findGroup(x, y, tiles);
  if (group.length < 2) return null;

  // Calculate scores
  const symbol = group[0].displayData?.symbol as string;
  const isFreshClear = unlockState.freshSymbols.includes(symbol);
  const baseValue = calculateBaseValue(
    symbol,
    state.flashSaleItem,
    state.flashSaleTapsLeft,
    isFreshClear
  );
  const comboMultiplier = getComboMultiplier(group.length);
  const { extraClearedKeys, bonusScore } = features?.bombs
    ? applyBombExplosion(group, tiles, gridSize)
    : { extraClearedKeys: new Set<string>(), bonusScore: 0 };

  const prevCombo = features?.comboChain && state.combo ? state.combo : resetCombo();
  const newCombo = features?.comboChain ? updateCombo(prevCombo, group.length) : resetCombo();
  const comboChainMult = features?.comboChain ? newCombo.multiplier : 1;

  const newCartItems = state.cartItems + group.length;
  const cartBonus = calculateCartBonus(state.cartItems, newCartItems);
  const scoreDelta = calculateScoreDelta(
    baseValue,
    group.length,
    comboMultiplier,
    comboChainMult,
    bonusScore,
    cartBonus
  );

  // Process clearing
  const {
    tiles: nextTiles,
    unlockState: newUnlockState,
    newSymbolUnlocked,
  } = processTileClearing(group, tiles, extraClearedKeys, features, gcols, grows, unlockState);

  // Handle thief
  const { tiles: remainingWithThiefClear, unblocked: scaredThiefKeys } = unblockNearGroup(
    group,
    nextTiles,
    'hasThief',
    minGroupSize
  );
  const thiefScared = isNotEmpty(scaredThiefKeys);
  const newThiefPositions = (state.thiefPositions || []).filter((pos) => !scaredThiefKeys.has(pos));

  // Update flash sale
  const newFlashSaleTapsLeft = state.flashSaleTapsLeft > 0 ? state.flashSaleTapsLeft - 1 : 0;
  const newFlashSaleItem = newFlashSaleTapsLeft <= 0 ? null : state.flashSaleItem;

  // Build state
  let newState = buildNewModeState({
    state,
    groupSize: group.length,
    scoreDelta,
    newCartItems,
    cartBonus,
    newFlashSaleTapsLeft,
    flashSaleItem: newFlashSaleItem,
    newThiefPositions,
    thiefScared,
    newUnlockState,
    newSymbolUnlocked,
    symbol,
    isFreshClear,
    newCombo,
  });

  if (!newState.flashSaleItem) {
    newState = maybeTriggerFlashSale(newState);
  }

  const timeBonus = calculateTimeBonus(group.length, timeLeft, features);

  return {
    tiles: remainingWithThiefClear,
    valid: true,
    scoreDelta,
    customState: newState,
    timeBonus,
  };
}

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
    const features = modeState?.features as
      | { rain?: boolean; thieves?: boolean; blockerIntensity?: 0 | 1 | 2 }
      | undefined;

    const storedState = (state.modeState as ShoppingModeState) || getInitialState();
    let updatedState: ShoppingModeState | null = null;
    let updatedTiles = state.tiles;

    if (features?.rain) {
      const rainResult = processRainTick(updatedTiles, state, storedState);
      updatedTiles = rainResult.tiles;
      if (rainResult.newState) updatedState = rainResult.newState;
    }

    if (features?.thieves) {
      const base = updatedState ?? storedState;
      const thiefResult = processThiefTick(updatedTiles, state, base);
      updatedTiles = thiefResult.tiles;
      if (thiefResult.newState) updatedState = thiefResult.newState;
    }

    if (updatedState !== null) {
      return { tiles: updatedTiles, modeState: updatedState };
    }

    if (features && features.thieves) {
      return processUnlimitedThiefTick(state, modeState ?? {}, storedState, features);
    }
    return null;
  },

  onTileTap(x, y, tiles, gridSize, modeState): TapResult | null {
    const state: ShoppingModeState = (modeState as ShoppingModeState) || getInitialState();
    const world = (modeState?.world as number) ?? 4;
    const minGroupSize = world <= 2 ? 3 : 4;
    const features = modeState?.features as any;
    const gcols = (modeState?.gridCols as number) ?? gridSize;
    const grows = (modeState?.gridRows as number) ?? gridSize;

    const unlockState: SymbolUnlockState =
      state.lockedSymbols != null
        ? { lockedSymbols: state.lockedSymbols, freshSymbols: state.freshSymbols ?? [] }
        : { lockedSymbols: [...SHOPPING_BONUS_ITEMS], freshSymbols: [] };

    return processShoppingTap({
      x,
      y,
      tiles,
      gridSize,
      state,
      world,
      features,
      gcols,
      grows,
      unlockState,
      minGroupSize,
      timeLeft: modeState?.timeLeft as number | undefined,
    });
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

    // Try event-based notifications first (highest priority)
    const eventNotif = getEventNotification(state, modeState ?? {}, delta);
    if (eventNotif) return eventNotif;

    // Fall back to score notifications
    return getScoreNotification(delta, timeBonus, timeLeft);
  },

  statsLabels: { moves: 'TAPS' },
  statsDisplay: [{ type: 'score' }, { type: 'moves' }],
};
