// GEM BLAST MODE — Cascade Chain Reactions
//
// Tap a connected group of 2+ matching gems to clear them.
// Cleared gems fall and any new groups AUTO-CLEAR with a cascade multiplier.
// 💥 Blast gems explode one entire random color when matched.
//
// Scoring: n² × 8 base, cascade multiplier up to 5×.
// Win: reach targetScore within maxMoves (or before time runs out).

import type { GameModeConfig, TapResult, WinResult, LossResult, TileColors } from '../types';
import type { Tile } from '../../types';
import { pickRandom, isEmpty, isNotEmpty } from '@/utils/conditionalStyles';
import { GEM_LEVELS, GEM_WORLDS, GEM_SYMBOLS, BLAST_GEM, generateGrid } from './levels';
import { GEM_BLAST_TUTORIAL_STEPS } from './tutorial';
import { renderGemBlastDemo } from './demo';
import { GEM_BLAST_WALKTHROUGH } from './walkthrough';
import { findGroup, findAllGroups } from '../arcadeShared';
import { reshuffleTiles, hasValidGroup } from '../arcadeUtils';

// ── Helper functions ──────────────────────────────────────────────────────────

/**
 * Blast gem spawn chance by world tier.
 */
const BLAST_CHANCE_BY_WORLD: Array<{ minWorld: number; chance: number }> = [
  { minWorld: 4, chance: 0.07 },
  { minWorld: 3, chance: 0.05 },
  { minWorld: 2, chance: 0.03 },
  { minWorld: 0, chance: 0 },
];

/**
 * Get blast gem chance based on world (replaces nested ternary)
 */
function getBlastChance(world: number): number {
  for (const tier of BLAST_CHANCE_BY_WORLD) {
    if (world >= tier.minWorld) return tier.chance;
  }
  return 0;
}

/**
 * Get blast gem style
 */
function getBlastGemStyle(): TileColors {
  return {
    background: 'linear-gradient(145deg, #2d1400 0%, #1a0800 100%)',
    border: '2px solid #f97316',
    boxShadow: '0 0 22px rgba(249,115,22,0.9), 0 0 8px rgba(255,255,255,0.3)',
  };
}

/**
 * Get new tile glow style
 */
function getNewGemStyle(baseColor: TileColors): TileColors {
  return {
    background: `linear-gradient(145deg, ${baseColor.background} 0%, ${baseColor.background}bb 100%)`,
    border: '2px solid #e0f2fe',
    boxShadow: '0 0 18px rgba(224,242,254,0.75), 0 0 6px rgba(224,242,254,0.4)',
  };
}

/**
 * Get regular gem style
 */
function getRegularGemStyle(baseColor: TileColors): TileColors {
  return {
    background: `linear-gradient(145deg, ${baseColor.background} 0%, ${baseColor.background}bb 100%)`,
    border: baseColor.border,
    boxShadow: baseColor.boxShadow,
  };
}

// ── Blast gem logic helpers ────────────────────────────────────────────────────

function processBlastGemClear(
  group: Tile[],
  tiles: Tile[]
): Set<string> {
  const extraClearedKeys = new Set<string>();
  const hasBlast = group.some((t) => t.displayData?.symbol === BLAST_GEM);

  if (!hasBlast) return extraClearedKeys;

  const blastGems = group.filter((t) => t.displayData?.symbol === BLAST_GEM);
  const nearbySymbols = tiles
    .filter((bg) => {
      if (!bg.canRotate || bg.displayData?.symbol === BLAST_GEM) return false;
      return blastGems.some((b) => Math.abs(b.x - bg.x) + Math.abs(b.y - bg.y) <= 4);
    })
    .map((t) => t.displayData?.symbol)
    .filter(Boolean) as string[];

  if (isEmpty(nearbySymbols)) return extraClearedKeys;

  const targetSym = pickRandom(nearbySymbols);
  for (const t of tiles) {
    if (!t.canRotate || t.displayData?.symbol !== targetSym) continue;
    if (blastGems.some((b) => Math.abs(b.x - t.x) + Math.abs(b.y - t.y) <= 3)) {
      extraClearedKeys.add(`${t.x},${t.y}`);
    }
  }

  return extraClearedKeys;
}

function processCascades(
  tiles: Tile[],
  gcols: number,
  grows: number,
  blastChance: number
): { tiles: Tile[]; totalScore: number; cascadeLevel: number } {
  let remaining = tiles;
  let totalScore = 0;
  let cascadeLevel = 1;
  const CASCADE_MULTS = [1, 2, 4, 7, 12];

  while (true) {
    const newGroups = findAllGroups(remaining, 2);
    if (isEmpty(newGroups)) break;

    cascadeLevel = Math.min(cascadeLevel + 1, CASCADE_MULTS.length);
    const cascadeMult = CASCADE_MULTS[cascadeLevel - 1];

    for (const g of newGroups) {
      totalScore += Math.round(g.length * g.length * 3 * cascadeMult);
      const gKeys = new Set(g.map((t) => `${t.x},${t.y}`));
      remaining = remaining.filter((t) => !gKeys.has(`${t.x},${t.y}`));
    }

    remaining = applyGravity(remaining, gcols, grows, blastChance);
  }

  return { tiles: remaining, totalScore, cascadeLevel };
}

// ── Gem color palette ─────────────────────────────────────────────────────────

const GEM_COLORS: Record<string, TileColors> = {
  '💎': {
    background: '#062d35',
    border: '2px solid #06b6d4',
    boxShadow: '0 0 10px rgba(6,182,212,0.6)',
  },
  '💍': {
    background: '#2d2500',
    border: '2px solid #d4af37',
    boxShadow: '0 0 10px rgba(212,175,55,0.6)',
  },
  '🔮': {
    background: '#1a0a2d',
    border: '2px solid #8b5cf6',
    boxShadow: '0 0 10px rgba(139,92,246,0.6)',
  },
  '🟣': {
    background: '#1a082d',
    border: '2px solid #a855f7',
    boxShadow: '0 0 10px rgba(168,85,247,0.6)',
  },
  '🔵': {
    background: '#062040',
    border: '2px solid #3b82f6',
    boxShadow: '0 0 10px rgba(59,130,246,0.6)',
  },
  '💥': {
    background: '#2d1400',
    border: '2px solid #f97316',
    boxShadow: '0 0 22px rgba(249,115,22,0.9), 0 0 8px rgba(255,255,255,0.3)',
  },
};

// ── Gravity + refill ──────────────────────────────────────────────────────────

function applyGravity(
  tiles: Tile[],
  gridCols: number,
  gridRows: number,
  blastChance = 0.03
): Tile[] {
  const survivors = tiles.filter((t) => t.canRotate);
  const activeSymbols = (survivors[0]?.displayData?.activeSymbols as string[]) ?? GEM_SYMBOLS;

  const result: Tile[] = [];

  for (let col = 0; col < gridCols; col++) {
    const colTiles = survivors.filter((t) => t.x === col).sort((a, b) => b.y - a.y);

    for (let i = 0; i < colTiles.length; i++) {
      const d = colTiles[i].displayData ?? {};
      result.push({
        ...colTiles[i],
        y: gridRows - 1 - i,
        justRotated: false,
        displayData: { ...d, isNew: false },
      });
    }

    const fillCount = gridRows - colTiles.length;
    for (let row = 0; row < fillCount; row++) {
      const symbol = Math.random() < blastChance ? BLAST_GEM : pickRandom(activeSymbols);
      result.push({
        id: `gb-${col}-${row}-${Math.random().toString(36).slice(2, 7)}`,
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

  return result;
}

// ── Check for valid moves ─────────────────────────────────────────────────────

function hasValidMove(tiles: Tile[]): boolean {
  return hasValidGroup(tiles);
}

// ── Notification helpers ──────────────────────────────────────────────────────

/**
 * Cascade notification templates by cascade level.
 */
const CASCADE_NOTIFICATIONS: Array<{ minLevel: number; emoji: string; text: string }> = [
  { minLevel: 5, emoji: '💎💥', text: 'MAX CASCADE' },
  { minLevel: 4, emoji: '🔥', text: 'CASCADE' },
  { minLevel: 3, emoji: '✨', text: 'CASCADE' },
  { minLevel: 0, emoji: '🔗', text: 'CASCADE' },
];

function getCascadeNotification(delta: number, cascade: number, modeState: any): string {
  const mult = (modeState?.cascadeMult as number) ?? 1;
  const multStr = mult.toFixed(0);

  for (const notif of CASCADE_NOTIFICATIONS) {
    if (cascade >= notif.minLevel) {
      return `+${delta} ${notif.emoji} ${notif.text} ×${multStr}!`;
    }
  }
  return `+${delta} 🔗 CASCADE ×${multStr}!`;
}

// ── Reshuffle if no valid moves ───────────────────────────────────────────────

function reshuffle(tiles: Tile[]): Tile[] {
  return reshuffleTiles(tiles, {
    markNew: true,
    filterFn: (t) => t.canRotate && !!t.displayData?.symbol,
  });
}

// ── Time bonus calculation for timed levels ───────────────────────────────────

/**
 * Time bonus tiers by cascade level and group size.
 * Cascade bonuses override group size bonuses.
 */
const TIME_BONUS_TIERS: Array<{ minLevel: number; minSize?: number; bonus: number }> = [
  { minLevel: 5, bonus: 12 },
  { minLevel: 4, bonus: 8 },
  { minLevel: 3, bonus: 5 },
  { minLevel: 0, minSize: 7, bonus: 4 },
  { minLevel: 0, minSize: 4, bonus: 2 },
  { minLevel: 0, bonus: 1 },
];

/**
 * Calculate time bonus based on cascade level and group size.
 * Timed levels (Worlds 3+) award more time for bigger chains.
 */
function calculateGemTimeBonus(cascadeLevel: number, groupSize: number): number {
  for (const tier of TIME_BONUS_TIERS) {
    if (cascadeLevel >= tier.minLevel && (tier.minSize === undefined || groupSize >= tier.minSize)) {
      return tier.bonus;
    }
  }
  return 1;
}

// ── Mode config ───────────────────────────────────────────────────────────────

export const GemBlastMode: GameModeConfig = {
  id: 'gemBlast',
  name: 'Gem Blast',
  description: 'Clear gems and trigger cascades. Blast gems detonate entire colors!',
  icon: '💎',
  color: '#06b6d4',
  wallCompression: 'never',
  supportsUndo: false,
  useMoveLimit: true,
  getLevels: () => GEM_LEVELS,
  worlds: GEM_WORLDS,
  supportsWorkshop: false,
  overlayText: { win: 'CHAIN COMPLETE!' },

  tileRenderer: {
    type: 'gemBlast',
    hidePipes: true,
    symbolSize: '1.5rem',

    getColors(tile, _ctx) {
      if (!tile.canRotate) {
        return { background: 'rgba(10,10,20,0)', border: '1px solid transparent' };
      }

      const sym = tile.displayData?.symbol as string;

      // Blast gem — orange glow
      if (sym === BLAST_GEM) {
        return getBlastGemStyle();
      }

      const baseColor = GEM_COLORS[sym] ?? {
        background: '#0a0a1e',
        border: '2px solid #6366f1',
        boxShadow: '0 0 10px rgba(99,102,241,0.5)',
      };

      return tile.displayData?.isNew ? getNewGemStyle(baseColor) : getRegularGemStyle(baseColor);
    },

    getSymbol(tile) {
      if (!tile.canRotate) return null;
      return (tile.displayData?.symbol as string) ?? null;
    },
  },

  onTileTap(x, y, tiles, gridSize, modeState): TapResult | null {
    const group = findGroup(x, y, tiles);
    if (group.length < 2) return null;

    const gcols = (modeState?.gridCols as number) ?? gridSize;
    const grows = (modeState?.gridRows as number) ?? gridSize;
    const world = (modeState?.world as number) ?? 1;
    const blastChance = getBlastChance(world);

    const activeSymbols =
      (tiles.find((t) => t.canRotate)?.displayData?.activeSymbols as string[]) ?? GEM_SYMBOLS;

    // Process blast gem side effects
    const extraClearedKeys = processBlastGemClear(group, tiles);

    // Remove initial group + blast extras
    const clearedKeys = new Set([...group.map((t) => `${t.x},${t.y}`), ...extraClearedKeys]);
    let remaining = tiles.filter((t) => !clearedKeys.has(`${t.x},${t.y}`));

    // Apply gravity
    remaining = applyGravity(remaining, gcols, grows, blastChance);

    // Initial score — n²×3, linear bonus for blast-cleared tiles
    let totalScore = group.length * group.length * 3;
    if (isNotEmpty(extraClearedKeys)) {
      totalScore += extraClearedKeys.size * 5;
    }

    // Process cascades
    const cascadeResult = processCascades(remaining, gcols, grows, blastChance);
    remaining = cascadeResult.tiles;
    totalScore += cascadeResult.totalScore;
    const cascadeLevel = cascadeResult.cascadeLevel;

    // Deadlock check
    if (!hasValidMove(remaining)) {
      remaining = reshuffle(remaining);
    }

    // Time bonus for timed levels (World 3, 4, 5) — bigger cascades = more time
    const timeLeft = modeState?.timeLeft as number | undefined;
    const timeBonus = timeLeft !== undefined && group.length >= 3
      ? calculateGemTimeBonus(cascadeLevel, group.length)
      : 0;

    const CASCADE_MULTS = [1, 2, 4, 7, 12];
    const cascadeMult = CASCADE_MULTS[Math.min(cascadeLevel, CASCADE_MULTS.length) - 1];

    return {
      tiles: remaining,
      valid: true,
      scoreDelta: totalScore,
      timeBonus,
      customState: {
        ...(modeState as Record<string, unknown>),
        cascadeLevel,
        cascadeMult,
        activeSymbols,
      },
    };
  },

  checkWin(_tiles, _goalNodes, _moves, _maxMoves, modeState): WinResult {
    const score = (modeState?.score as number) ?? 0;
    const target = (modeState?.targetScore as number) ?? Infinity;
    const won = score >= target;
    return { won, reason: won ? 'Chain complete!' : undefined };
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
    return new Set(tiles.filter((t) => t.canRotate).map((t) => `${t.x},${t.y}`));
  },

  tutorialSteps: GEM_BLAST_TUTORIAL_STEPS,
  renderDemo: renderGemBlastDemo,
  walkthrough: GEM_BLAST_WALKTHROUGH,

  getNotification(_tiles, _moves, modeState) {
    const delta = (modeState?.scoreDelta as number) ?? 0;
    if (delta <= 0) return null;

    const cascade = (modeState?.cascadeLevel as number) ?? 1;
    if (cascade >= 2) return getCascadeNotification(delta, cascade, modeState);

    const n = Math.round(Math.sqrt(delta / 3));
    if (n >= 8) return `+${delta} 🔥 MEGA CHAIN!`;
    return n >= 5 ? `+${delta} GREAT!` : null;
  },

  statsLabels: { moves: 'TAPS' },
  statsDisplay: [{ type: 'score' }, { type: 'moves' }],
};

// Re-export for use in ArcadeHubScreen
export { generateGrid, GEM_SYMBOLS };
export { seededRandom } from '../seedUtils';
