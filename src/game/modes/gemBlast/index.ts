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
import {
  GEM_LEVELS,
  GEM_WORLDS,
  GEM_SYMBOLS,
  BLAST_GEM,
  generateGrid,
  seededRandom,
} from './levels';
import { GEM_BLAST_TUTORIAL_STEPS } from './tutorial';
import { renderGemBlastDemo } from './demo';
import { GEM_BLAST_WALKTHROUGH } from './walkthrough';
import { findGroup, findAllGroups } from '../arcadeShared';

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
      let symbol: string;
      if (Math.random() < blastChance) {
        symbol = BLAST_GEM;
      } else {
        symbol = activeSymbols[Math.floor(Math.random() * activeSymbols.length)];
      }
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
  return tiles.some((t) => {
    if (!t.canRotate || !t.displayData?.symbol) return false;
    const group = findGroup(t.x, t.y, tiles);
    return group.length >= 2;
  });
}

// ── Reshuffle if no valid moves ───────────────────────────────────────────────

function reshuffle(tiles: Tile[]): Tile[] {
  const symbols = tiles
    .filter((t) => t.canRotate && t.displayData?.symbol)
    .map((t) => t.displayData!.symbol as string);

  // Shuffle symbols
  for (let i = symbols.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
  }

  let idx = 0;
  return tiles.map((t) => {
    if (!t.canRotate || !t.displayData?.symbol) return t;
    return {
      ...t,
      displayData: {
        ...t.displayData,
        symbol: symbols[idx++],
        isNew: true,
      },
    };
  });
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
        return {
          background: 'linear-gradient(145deg, #2d1400 0%, #1a0800 100%)',
          border: '2px solid #f97316',
          boxShadow: '0 0 22px rgba(249,115,22,0.9), 0 0 8px rgba(255,255,255,0.3)',
        };
      }

      const c = GEM_COLORS[sym] ?? {
        background: '#0a0a1e',
        border: '2px solid #6366f1',
        boxShadow: '0 0 10px rgba(99,102,241,0.5)',
      };

      if (tile.displayData?.isNew) {
        return {
          background: `linear-gradient(145deg, ${c.background} 0%, ${c.background}bb 100%)`,
          border: '2px solid #e0f2fe',
          boxShadow: '0 0 18px rgba(224,242,254,0.75), 0 0 6px rgba(224,242,254,0.4)',
        };
      }

      return {
        background: `linear-gradient(145deg, ${c.background} 0%, ${c.background}bb 100%)`,
        border: c.border,
        boxShadow: c.boxShadow,
      };
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
    const blastChance = world >= 4 ? 0.07 : world >= 3 ? 0.05 : world >= 2 ? 0.03 : 0;

    const activeSymbols =
      (tiles.find((t) => t.canRotate)?.displayData?.activeSymbols as string[]) ?? GEM_SYMBOLS;

    // ── Blast gem: clears tiles of one color within radius 3 of any blast gem ──
    const hasBlast = group.some((t) => t.displayData?.symbol === BLAST_GEM);
    const extraClearedKeys = new Set<string>();
    if (hasBlast) {
      const blastGems = group.filter((t) => t.displayData?.symbol === BLAST_GEM);
      // Pick a random non-blast color from nearby tiles
      const nearbySymbols = tiles
        .filter((bg) => {
          if (!bg.canRotate || bg.displayData?.symbol === BLAST_GEM) return false;
          return blastGems.some((b) => Math.abs(b.x - bg.x) + Math.abs(b.y - bg.y) <= 4);
        })
        .map((t) => t.displayData?.symbol as string)
        .filter(Boolean);
      if (nearbySymbols.length > 0) {
        const targetSym = nearbySymbols[Math.floor(Math.random() * nearbySymbols.length)];
        // Clear all tiles of that color within radius 3 of any blast gem
        for (const t of tiles) {
          if (!t.canRotate || t.displayData?.symbol !== targetSym) continue;
          if (blastGems.some((b) => Math.abs(b.x - t.x) + Math.abs(b.y - t.y) <= 3)) {
            extraClearedKeys.add(`${t.x},${t.y}`);
          }
        }
      }
    }

    // Step 1: Remove initial group + blast extras
    const clearedKeys = new Set([...group.map((t) => `${t.x},${t.y}`), ...extraClearedKeys]);
    let remaining = tiles.filter((t) => !clearedKeys.has(`${t.x},${t.y}`));

    // Step 2: Apply gravity
    remaining = applyGravity(remaining, gcols, grows, blastChance);

    // Step 3: Initial score — n²×3, linear bonus for blast-cleared tiles
    let cascadeMult = 1.0;
    let totalScore = group.length * group.length * 3;
    if (extraClearedKeys.size > 0) {
      totalScore += extraClearedKeys.size * 5;
    }

    // Step 4: Cascade loop — each level adds 0.5× multiplier, cap at 3×
    let cascadeLevel = 1;
    while (true) {
      const newGroups = findAllGroups(remaining, 2);
      if (newGroups.length === 0) break;

      cascadeLevel = Math.min(cascadeLevel + 1, 5);
      cascadeMult = Math.min(1.0 + (cascadeLevel - 1) * 0.5, 3.0);

      for (const g of newGroups) {
        totalScore += Math.round(g.length * g.length * 3 * cascadeMult);
        const gKeys = new Set(g.map((t) => `${t.x},${t.y}`));
        remaining = remaining.filter((t) => !gKeys.has(`${t.x},${t.y}`));
      }

      remaining = applyGravity(remaining, gcols, grows, blastChance);
    }

    // Deadlock check
    if (!hasValidMove(remaining)) {
      remaining = reshuffle(remaining);
    }

    // Time bonus for timed levels (World 3, 4, 5)
    const timeLeft = modeState?.timeLeft as number | undefined;
    let timeBonus = 0;
    if (timeLeft !== undefined && group.length >= 3) {
      if (cascadeLevel >= 4) timeBonus = 8;
      else if (cascadeLevel >= 3) timeBonus = 5;
      else if (group.length >= 7) timeBonus = 4;
      else if (group.length >= 4) timeBonus = 2;
      else timeBonus = 1;
    }

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
    const cascade = (modeState?.cascadeLevel as number) ?? 1;
    const mult = (modeState?.cascadeMult as number) ?? 1;
    if (delta <= 0) return null;
    if (cascade >= 5) return `+${delta} 💎💥 MAX CASCADE ×${mult.toFixed(1)}!`;
    if (cascade >= 3) return `+${delta} ✨ CASCADE ×${mult.toFixed(1)}!`;
    if (cascade >= 2) return `+${delta} 🔗 CASCADE!`;
    const n = Math.round(Math.sqrt(delta / 3));
    if (n >= 8) return `+${delta} 🔥 MEGA CHAIN!`;
    if (n >= 5) return `+${delta} GREAT!`;
    return null;
  },

  statsLabels: { moves: 'TAPS' },
  statsDisplay: [{ type: 'score' }, { type: 'moves' }],
};

// Re-export for use in ArcadeHubScreen
export { generateGrid, seededRandom, GEM_SYMBOLS };
