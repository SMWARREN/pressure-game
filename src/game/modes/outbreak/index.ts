// OUTBREAK MODE — Territory Spreading Puzzle
//
// ── How to play ──────────────────────────────────────────────────────────────
//   TAP any frontier cell (bright colored border) to absorb its entire
//   connected same-color group into your infection.
//
//   The NUMBER on each frontier cell tells you exactly how many cells
//   you'll gain from that tap. Always pick the biggest number!
//
//   WIN  : own every cell on the board.
//   LOSE : run out of moves before full infection.

import { GameModeConfig, TapResult, WinResult, LossResult } from '../types';
import { Tile } from '../../types';
import {
  OUTBREAK_LEVELS,
  OUTBREAK_WORLDS,
  OUTBREAK_COLORS,
  OUTBREAK_DARK,
  OUTBREAK_ICONS,
  computeFrontierData,
} from './levels';

// ── Per-tile display data ─────────────────────────────────────────────────────

interface OutbreakData extends Record<string, unknown> {
  colorIndex: number;  // 0-4 → OUTBREAK_COLORS / OUTBREAK_ICONS
  owned:      boolean; // true = player controls this cell
  isNew:      boolean; // true = absorbed on this tap (triggers flash)
  isFrontier?: boolean; // directly adjacent to territory = tappable
  groupSize?:  number;  // how many cells this tap would absorb
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DIRS: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];

function buildMap(tiles: Tile[]): Map<string, Tile> {
  const m = new Map<string, Tile>();
  for (const t of tiles) m.set(`${t.x},${t.y}`, t);
  return m;
}

function bfsSameColor(x: number, y: number, colorIndex: number, map: Map<string, Tile>): Tile[] {
  const visited = new Set<string>();
  const queue: string[] = [`${x},${y}`];
  const group: Tile[] = [];
  while (queue.length) {
    const key = queue.shift()!;
    if (visited.has(key)) continue;
    visited.add(key);
    const t = map.get(key);
    if (!t) continue;
    const d = t.displayData as OutbreakData;
    if (d.owned || d.colorIndex !== colorIndex) continue;
    group.push(t);
    for (const [dx, dy] of DIRS) {
      const nk = `${t.x + dx},${t.y + dy}`;
      if (!visited.has(nk)) queue.push(nk);
    }
  }
  return group;
}

function touchesTerritory(group: Tile[], map: Map<string, Tile>): boolean {
  for (const t of group) {
    for (const [dx, dy] of DIRS) {
      const nb = map.get(`${t.x + dx},${t.y + dy}`);
      if (nb && (nb.displayData as OutbreakData)?.owned) return true;
    }
  }
  return false;
}

// ── Mode config ───────────────────────────────────────────────────────────────

export const OutbreakMode: GameModeConfig = {
  id: 'outbreak',
  name: 'Outbreak',
  description: 'Spread your infection. Tap groups to absorb them — numbers show how many cells you gain!',
  icon: '🦠',
  color: '#06b6d4',

  wallCompression: 'never',
  supportsUndo: false,
  useMoveLimit: true,

  getLevels: () => OUTBREAK_LEVELS,
  worlds: OUTBREAK_WORLDS,
  supportsWorkshop: false,

  overlayText: { win: 'FULL INFECTION!', loss: 'CONTAINED!' },

  statsLabels: { moves: 'MOVES' },
  statsDisplay: [{ type: 'score' }, { type: 'moves' }],

  // ── Visual rendering ────────────────────────────────────────────────────────
  //
  // Three clearly distinct visual states:
  //
  //   OWNED      → vivid solid color fill + soft glow  (this is YOUR territory)
  //   FRONTIER   → dark background + full-color border + group size number
  //                (you can tap this right now)
  //   INTERIOR   → near-black + barely visible tint
  //                (not reachable yet — need to absorb the way there first)
  //
  tileRenderer: {
    type: 'outbreak',
    hidePipes: true,
    symbolSize: '0.82rem',

    getColors(tile) {
      const d = tile.displayData as OutbreakData;
      if (!d) return { background: '#080810', border: '1px solid #1a1a2a' };

      const lit  = OUTBREAK_COLORS[d.colorIndex] ?? '#888';
      const dark = OUTBREAK_DARK[d.colorIndex]   ?? '#111';

      // ── OWNED ──────────────────────────────────────────────────────────────
      if (d.owned) {
        if (d.isNew) {
          // Flash: white → vivid color gradient, strong glow
          return {
            background: `linear-gradient(160deg, #ffffff33 0%, ${lit}ee 60%, ${dark} 100%)`,
            border: `2px solid #ffffff`,
            boxShadow: `0 0 24px ${lit}, 0 0 8px #ffffff66`,
          };
        }
        // Stable territory: solid vivid fill so it reads unmistakably as "mine"
        return {
          background: `linear-gradient(160deg, ${lit}cc 0%, ${dark} 100%)`,
          border: `2px solid ${lit}`,
          boxShadow: `0 0 7px ${lit}55`,
        };
      }

      // ── FRONTIER (tappable) ────────────────────────────────────────────────
      if (d.isFrontier) {
        return {
          background: `linear-gradient(160deg, #0e0e1c 0%, ${dark}bb 100%)`,
          border: `2px solid ${lit}cc`,
          boxShadow: `0 0 10px ${lit}44`,
          color: lit,  // number label in the tile's own color
        };
      }

      // ── INTERIOR (not yet reachable) ───────────────────────────────────────
      return {
        background: `linear-gradient(160deg, #080810 0%, ${dark}44 100%)`,
        border: `1px solid ${lit}1e`,
      };
    },

    getSymbol(tile) {
      const d = tile.displayData as OutbreakData;
      if (!d || d.owned) return null;

      // Frontier: show group size so player knows the value of this tap
      if (d.isFrontier && d.groupSize != null) {
        return String(d.groupSize);
      }

      // Interior unowned: show the strain emoji so players can plan ahead
      // (only when tileSize is big enough to be legible)
      return OUTBREAK_ICONS[d.colorIndex] ?? null;
    },
  },

  // ── Core logic ───────────────────────────────────────────────────────────────
  onTileTap(x, y, tiles, _gridSize, _modeState): TapResult | null {
    const map = buildMap(tiles);
    const tapped = map.get(`${x},${y}`);
    if (!tapped) return null;

    const d = tapped.displayData as OutbreakData;
    if (!d || d.owned) return null;

    const group = bfsSameColor(x, y, d.colorIndex, map);
    if (group.length === 0) return null;
    if (!touchesTerritory(group, map)) return null;

    const groupKeys = new Set(group.map(t => `${t.x},${t.y}`));

    // Absorb group + clear previous isNew flags
    const absorbed = tiles.map(t => {
      const td = t.displayData as OutbreakData;
      if (!td) return t;
      if (groupKeys.has(`${t.x},${t.y}`)) return { ...t, displayData: { ...td, owned: true, isNew: true } };
      if (td.isNew)                         return { ...t, displayData: { ...td, isNew: false } };
      return t;
    });

    // Recompute frontier data so the next render immediately shows updated numbers
    const updated = computeFrontierData(absorbed);

    return { tiles: updated, valid: true, scoreDelta: group.length * 10 };
  },

  checkWin(_t, _g, _m, _max, modeState): WinResult {
    const score  = (modeState?.score  as number) ?? 0;
    const target = (modeState?.targetScore as number) ?? Infinity;
    return { won: score >= target };
  },

  checkLoss(_t, _w, moves, maxMoves, modeState): LossResult {
    const score  = (modeState?.score  as number) ?? 0;
    const target = (modeState?.targetScore as number) ?? Infinity;
    if (moves >= maxMoves && score < target) return { lost: true, reason: 'Contained!' };
    return { lost: false };
  },

  getWinTiles(tiles): Set<string> {
    return new Set(tiles.map(t => `${t.x},${t.y}`));
  },

  // Always show frontier tiles as hints (the ones with colored borders)
  getHintTiles(tiles): Set<string> {
    const hints = new Set<string>();
    for (const t of tiles) {
      if ((t.displayData as OutbreakData)?.isFrontier) hints.add(`${t.x},${t.y}`);
    }
    return hints;
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  getNotification(_tiles, _moves, modeState) {
    const delta  = (modeState?.scoreDelta   as number) ?? 0;
    if (delta <= 0) return null;

    const cells  = delta / 10;
    const score  = (modeState?.score        as number) ?? 0;
    const target = (modeState?.targetScore  as number) ?? 1;

    // Percentage now owned (score counts absorbed tiles; corner start = +1)
    const totalCells = Math.round(target / 10) + 1;
    const ownedCells = Math.round(score  / 10) + 1;
    const pct        = Math.min(100, Math.round((ownedCells / totalCells) * 100));
    const prevPct    = Math.min(100, Math.round(((ownedCells - cells) / totalCells) * 100));

    // Milestone messages — take priority over generic ones
    if (prevPct < 90 && pct >= 90) return `🔥 90% infected! Almost there!`;
    if (prevPct < 75 && pct >= 75) return `🦠 75% infected!`;
    if (prevPct < 50 && pct >= 50) return `📈 Halfway! ${pct}%`;
    if (prevPct < 25 && pct >= 25) return `🌱 25% — keep spreading!`;

    // Big burst messages
    if (cells >= 10) return `🦠 PANDEMIC! +${cells} cells · ${pct}%`;
    if (cells >= 6)  return `🔥 OUTBREAK! +${cells} cells · ${pct}%`;

    // Default: always show cells gained + running percentage
    return `+${cells} cell${cells !== 1 ? 's' : ''} · ${pct}%`;
  },

  // ── Tutorial ──────────────────────────────────────────────────────────────
  tutorialSteps: [
    {
      icon: '🦠',
      iconColor: '#06b6d4',
      title: 'You Are The Infection',
      subtitle: 'MISSION BRIEFING',
      demo: 'candy-group',
      body: 'You start with one infected cell in the corner.\n\nYour goal: infect EVERY cell on the board before moves run out.',
    },
    {
      icon: '🔢',
      iconColor: '#51cf66',
      title: 'Numbers Are Your Guide',
      subtitle: 'KEY MECHANIC',
      demo: 'candy-score',
      body: 'Every cell that borders your territory shows a NUMBER.\n\nThat number = how many cells you absorb in one tap. Always chase the biggest number!',
    },
    {
      icon: '🎨',
      iconColor: '#74c0fc',
      title: 'Colors & Icons',
      subtitle: 'READ THE BOARD',
      demo: 'candy-gravity',
      body: 'Bright colored border = tappable right now.\nDim cell with emoji = not reachable yet.\nSolid vivid color = already yours.\n\nThe emoji icons tell you each cell\'s strain color so you can plan ahead.',
    },
    {
      icon: '🗺️',
      iconColor: '#ffd43b',
      title: 'Think Ahead',
      subtitle: 'STRATEGY',
      demo: 'candy-ready',
      body: 'Absorbing one group unlocks new groups of other colors.\n\nAvoid tiny single-cell taps — every wasted move could cost you the game!',
    },
  ],
};
