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

// ── Mode State for Flash Sales, Cart & Thief ────────────────────────────────────────

interface ShoppingModeState extends Record<string, unknown> {
  flashSaleItem: string | null; // Which item is on sale
  flashSaleTapsLeft: number; // How many taps left in the sale
  cartItems: number; // Items in shopping cart
  cartBonus: number; // Bonus when cart is full (every 10 items)
  lastGroupSize: number; // For combo notifications
  thiefPositions: string[]; // "x,y" positions where thief is hiding
  thiefWarning?: string; // Warning message when thief appears
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
function applyGravity(tiles: Tile[], gridSize: number): Tile[] {
  const survivors = tiles.filter((t) => t.canRotate);
  const activeSymbols = (survivors.find((t) => t.canRotate)?.displayData
    ?.activeSymbols as string[]) ?? [...SHOPPING_ITEMS];

  const result: Tile[] = [];

  for (let col = 0; col < gridSize; col++) {
    const colTiles = survivors.filter((t) => t.x === col).sort((a, b) => b.y - a.y);

    // Pack existing tiles to the bottom
    for (let i = 0; i < colTiles.length; i++) {
      const d = colTiles[i].displayData ?? {};
      result.push({
        ...colTiles[i],
        y: gridSize - 1 - i,
        justRotated: false,
        displayData: { ...d, isNew: false },
      });
    }

    // Fill remaining slots from the top with new random items
    const fillCount = gridSize - colTiles.length;
    for (let row = 0; row < fillCount; row++) {
      // 💎 is rare (10% chance)
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
  '👗': { bg: '#2d1a2d', border: '#ec4899', glow: 'rgba(236,72,153,0.5)' }, // Pink dress
  '👠': { bg: '#2d1a1a', border: '#ef4444', glow: 'rgba(239,68,68,0.5)' }, // Red heels
  '👜': { bg: '#2d2418', border: '#d97706', glow: 'rgba(217,119,6,0.5)' }, // Brown bag
  '💄': { bg: '#2d0f1f', border: '#db2777', glow: 'rgba(219,39,119,0.5)' }, // Magenta lipstick
  '💎': { bg: '#0f1f2d', border: '#06b6d4', glow: 'rgba(6,182,212,0.6)' }, // Cyan diamond
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
      // Show thief emoji on thief tiles
      if (tile.displayData?.hasThief) return '🦹';
      if (!tile.canRotate) return null;
      return (tile.displayData?.symbol as string) ?? null;
    },
  },

  initialState: () => getInitialState(),

  onTick(state, modeState) {
    const timeLeft = modeState?.timeLeft as number | undefined;
    const levelId = modeState?.levelId as number | undefined;

    // Only run thief spawning on Unlimited world levels (314, 315)
    // Level 313 is PEACEFUL - no thieves!
    const isUnlimitedWithThieves = levelId !== undefined && levelId >= 314 && levelId <= 315;
    if (!isUnlimitedWithThieves || timeLeft === undefined) return null;

    const currentState: ShoppingModeState = (modeState as ShoppingModeState) || getInitialState();
    const tiles = state.tiles;

    // Progressive thief difficulty per level:
    // Level 313 (easiest): thieves only in last 20s, max 1 thief
    // Level 314 (medium): thieves in last 25s, max 2 thieves
    // Level 315 (hardest): thieves throughout, max 3 thieves
    let spawnChance = 0;
    let numThieves = 1;

    if (levelId === 313) {
      // Easiest - thieves only appear late, 1 at a time
      if (timeLeft < 10) spawnChance = 0.3;
      else if (timeLeft < 20) spawnChance = 0.15;
      numThieves = 1;
    } else if (levelId === 314) {
      // Medium - thieves appear mid-game, up to 2
      if (timeLeft < 10) spawnChance = 0.4;
      else if (timeLeft < 20) spawnChance = 0.25;
      else if (timeLeft < 25) spawnChance = 0.15;
      numThieves = timeLeft < 15 ? 2 : 1;
    } else {
      // Hardest (315) - thieves throughout, up to 3
      if (timeLeft < 10) spawnChance = 0.55;
      else if (timeLeft < 20) spawnChance = 0.4;
      else if (timeLeft < 30) spawnChance = 0.25;
      else spawnChance = 0.15;
      numThieves = timeLeft < 10 ? 3 : timeLeft < 20 ? 2 : 1;
    }

    // Don't spawn if random check fails
    if (Math.random() > spawnChance) return null;

    // Find tiles that don't already have a thief
    const existingThieves = new Set(currentState.thiefPositions || []);
    const candidates = tiles.filter((t) => t.canRotate && !existingThieves.has(`${t.x},${t.y}`));

    if (candidates.length === 0) return null;

    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const newThiefPositions: string[] = [];

    for (let i = 0; i < Math.min(numThieves, shuffled.length); i++) {
      newThiefPositions.push(`${shuffled[i].x},${shuffled[i].y}`);
    }

    if (newThiefPositions.length === 0) return null;

    // Mark tiles as having a thief (set canRotate to false temporarily)
    const thiefSet = new Set(newThiefPositions);
    const updatedTiles = tiles.map((t) => {
      if (thiefSet.has(`${t.x},${t.y}`)) {
        return {
          ...t,
          canRotate: false,
          displayData: { ...t.displayData, hasThief: true },
        };
      }
      return t;
    });

    return {
      tiles: updatedTiles,
      customState: {
        ...currentState,
        thiefPositions: [...existingThieves, ...newThiefPositions],
        thiefWarning: '🦹 THIEF! Match big groups to scare them away!',
      },
    };
  },

  onTileTap(x, y, tiles, gridSize, modeState): TapResult | null {
    const state: ShoppingModeState = (modeState as ShoppingModeState) || getInitialState();

    // Check if this tile has a thief - can't tap!
    const tileKey = `${x},${y}`;
    if (state.thiefPositions?.includes(tileKey)) {
      return { tiles, valid: false, scoreDelta: 0, customState: state };
    }

    const group = findGroup(x, y, tiles);
    if (group.length < 2) return null; // Need 2+ connected same-item tiles

    // Get the item type and its value
    const symbol = group[0].displayData?.symbol as string;
    let baseValue = ITEM_VALUES[symbol] ?? 10;

    // ⚡ FLASH SALE BONUS - 3× value if this item is on sale!
    if (state.flashSaleItem === symbol && state.flashSaleTapsLeft > 0) {
      baseValue *= 3;
    }

    // Calculate score: base value × group size × combo multiplier
    // Bigger groups get bonus multipliers
    let comboMultiplier = 1;
    if (group.length >= 5) comboMultiplier = 2;
    if (group.length >= 7) comboMultiplier = 3;
    if (group.length >= 10) comboMultiplier = 4;

    let scoreDelta = baseValue * group.length * comboMultiplier;

    // 🛒 SHOPPING CART BONUS - Every 10 items = bonus $50!
    const newCartItems = state.cartItems + group.length;
    let cartBonus = 0;
    if (Math.floor(newCartItems / 10) > Math.floor(state.cartItems / 10)) {
      cartBonus = 50;
      scoreDelta += cartBonus;
    }

    const clearedKeys = new Set(group.map((t) => `${t.x},${t.y}`));
    const remaining = tiles.filter((t) => !clearedKeys.has(`${t.x},${t.y}`));

    // 🦹 THIEF SCARING - Big combos (4+) scare away nearby thieves!
    // Groups of 4-5 scare thieves within 1 tile, 6+ scares within 2 tiles
    const scaredThiefKeys = new Set<string>();
    let thiefScared = false;
    if (group.length >= 4 && state.thiefPositions?.length) {
      const radius = group.length >= 6 ? 2 : 1;
      for (const clearedTile of group) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const key = `${clearedTile.x + dx},${clearedTile.y + dy}`;
            if (state.thiefPositions.includes(key)) {
              scaredThiefKeys.add(key);
              thiefScared = true;
            }
          }
        }
      }
    }

    // Remove scared thieves from remaining tiles and restore canRotate
    const remainingWithThiefClear = remaining.map((t) => {
      const key = `${t.x},${t.y}`;
      if (scaredThiefKeys.has(key) && t.displayData?.hasThief) {
        return { ...t, canRotate: true, displayData: { ...t.displayData, hasThief: false } };
      }
      return t;
    });

    // Update thief positions list
    const newThiefPositions = (state.thiefPositions || []).filter(
      (pos) => !scaredThiefKeys.has(pos)
    );

    let next = applyGravity(remainingWithThiefClear, gridSize);

    // If refill produces a deadlock, reshuffle
    if (!hasValidMove(next)) {
      next = reshuffle(next);
    }

    // Tick down flash sale on every tap (not just matching taps)
    const newFlashSaleTapsLeft = state.flashSaleTapsLeft > 0 ? state.flashSaleTapsLeft - 1 : 0;
    const newFlashSaleItem = newFlashSaleTapsLeft <= 0 ? null : state.flashSaleItem;

    // Update mode state — also store scoreDelta so getNotification can read it
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
    };

    // Maybe trigger a new flash sale
    if (!newState.flashSaleItem) {
      newState = maybeTriggerFlashSale(newState);
    }

    // Time bonus for Unlimited world (world 4) — bigger groups = more time!
    // Progressive difficulty: Level 1 = 2+, Level 2 = 3+, Level 3 = 4+ for time bonus
    const timeLeft = modeState?.timeLeft as number | undefined;
    const levelId = modeState?.levelId as number | undefined;
    let timeBonus = 0;
    if (timeLeft !== undefined) {
      // Determine minimum group size for time bonus based on level
      // Level 313 (easiest): 2+, Level 314 (medium): 3+, Level 315 (hardest): 4+
      let minGroupForTime = 4;
      if (levelId === 313) minGroupForTime = 2;
      else if (levelId === 314) minGroupForTime = 3;

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

  checkWin(_tiles, _goalNodes, _moves, _maxMoves, modeState): WinResult {
    const score = (modeState?.score as number) ?? 0;
    const target = (modeState?.targetScore as number) ?? Infinity;
    const won = score >= target;
    return { won, reason: won ? 'Shopping goal reached!' : undefined };
  },

  checkLoss(_tiles, _wallOffset, moves, maxMoves, modeState): LossResult {
    const score = (modeState?.score as number) ?? 0;
    const target = (modeState?.targetScore as number) ?? Infinity;
    if (moves >= maxMoves && score < target) {
      return { lost: true, reason: 'Out of taps!' };
    }
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
