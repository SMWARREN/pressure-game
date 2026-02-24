// LASER RELAY MODE
//
// Rotate mirrors to redirect a laser beam from its source to the target.
// Beam auto-traces through the grid, bouncing off / and \ mirrors.
// Tap a mirror tile to toggle its orientation.
// Win when the beam hits the target. Move limit = number of rotations allowed.
//
// Engine exploitation: checkWin traces the full beam path on every valid tap.
// tileRenderer animates the beam path in real-time cyan glow.

import { GameModeConfig, TapResult, WinResult } from '../types';
import { Tile } from '../../types';
import { LASER_LEVELS, LASER_WORLDS } from './levels';
import { LASER_TUTORIAL_STEPS } from './tutorial';
import { renderLaserDemo } from './demo';

// ── Mirror reflection tables ──────────────────────────────────────────────────

const SLASH: Record<string, string> = {
  right: 'up',
  up: 'right',
  left: 'down',
  down: 'left',
};
const BACK: Record<string, string> = {
  right: 'down',
  down: 'right',
  left: 'up',
  up: 'left',
};
const STEP: Record<string, { dx: number; dy: number }> = {
  right: { dx: 1, dy: 0 },
  left: { dx: -1, dy: 0 },
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
};

// ── Beam trace ────────────────────────────────────────────────────────────────

function buildTileMap(tiles: Tile[]): Map<string, Tile> {
  const m = new Map<string, Tile>();
  for (const t of tiles) m.set(`${t.x},${t.y}`, t);
  return m;
}

interface BeamResult {
  beamKeys: Set<string>;
  hitTarget: boolean;
}

export function traceLaser(tiles: Tile[], gridSize: number): BeamResult {
  const map = buildTileMap(tiles);
  const source = tiles.find((t) => t.displayData?.kind === 'source');
  if (!source) return { beamKeys: new Set(), hitTarget: false };

  let x = source.x;
  let y = source.y;
  let dir = source.displayData!.dir as string;
  const beamKeys = new Set<string>();
  let hitTarget = false;
  const maxSteps = gridSize * gridSize * 4; // prevent infinite loops
  let steps = 0;

  while (steps++ < maxSteps) {
    const { dx, dy } = STEP[dir];
    x += dx;
    y += dy;
    if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) break;

    const key = `${x},${y}`;
    const tile = map.get(key);
    if (!tile) break;
    const kind = tile.displayData?.kind as string;

    if (kind === 'wall' || kind === 'source') break;

    beamKeys.add(key);

    if (kind === 'target') {
      hitTarget = true;
      break;
    }

    if (kind === 'mirror') {
      const rot = tile.displayData?.rotation as number;
      const newDir = rot === 0 ? SLASH[dir] : BACK[dir];
      if (!newDir) break;
      dir = newDir;
    }
    // 'empty' — beam continues same direction
  }

  return { beamKeys, hitTarget };
}

function withBeamApplied(tiles: Tile[], gridSize: number): Tile[] {
  const { beamKeys } = traceLaser(tiles, gridSize);
  return tiles.map((t) => {
    const isBeam = beamKeys.has(`${t.x},${t.y}`);
    const wasBeam = t.displayData?.beamOn as boolean;
    if (wasBeam === isBeam) return t;
    return { ...t, displayData: { ...t.displayData, beamOn: isBeam } };
  });
}

// ── Tile colors ───────────────────────────────────────────────────────────────

function getTileColors(tile: Tile) {
  const kind = tile.displayData?.kind as string;
  const beamOn = tile.displayData?.beamOn as boolean;

  switch (kind) {
    case 'source':
      return {
        background: 'linear-gradient(145deg,#052e16,#065f46)',
        border: '2px solid #22c55e',
        boxShadow: '0 0 14px rgba(34,197,94,0.7)',
      };

    case 'target':
      return {
        background: 'linear-gradient(145deg,#2d0808,#450a0a)',
        border: '2px solid #ef4444',
        boxShadow: beamOn
          ? '0 0 24px rgba(239,68,68,1), 0 0 8px rgba(239,68,68,0.6)'
          : '0 0 8px rgba(239,68,68,0.35)',
      };

    case 'wall':
      return {
        background: '#1a1a2e',
        border: '2px solid #374151',
        boxShadow: 'none',
      };

    case 'mirror':
      if (beamOn) {
        return {
          background: 'linear-gradient(145deg,#1e3a5f,#0d2137)',
          border: '2px solid #38bdf8',
          boxShadow: '0 0 18px rgba(56,189,248,0.8)',
        };
      }
      return {
        background: 'linear-gradient(145deg,#0f172a,#1e293b)',
        border: '2px solid #475569',
        boxShadow: '0 0 4px rgba(71,85,105,0.3)',
      };

    default: // empty
      if (beamOn) {
        return {
          background: 'linear-gradient(145deg,#083344,#0a4254)',
          border: '1px solid #22d3ee',
          boxShadow: '0 0 10px rgba(34,211,238,0.45)',
        };
      }
      return {
        background: 'rgba(10,10,20,0.25)',
        border: '1px solid #1e293b',
        boxShadow: 'none',
      };
  }
}

function getTileSymbol(tile: Tile): string | null {
  const kind = tile.displayData?.kind as string;
  switch (kind) {
    case 'source': {
      const dir = tile.displayData?.dir as string;
      return dir === 'right' ? '▶' : dir === 'down' ? '▼' : dir === 'left' ? '◀' : '▲';
    }
    case 'target':
      return '◎';
    case 'wall':
      return '▪';
    case 'mirror': {
      const rot = tile.displayData?.rotation as number;
      return rot === 0 ? '╱' : '╲';
    }
    default:
      return tile.displayData?.beamOn ? '·' : null;
  }
}

// ── Mode config ───────────────────────────────────────────────────────────────

export const LaserRelayMode: GameModeConfig = {
  id: 'laserRelay',
  name: 'Laser Relay',
  description: 'Rotate mirrors to guide the laser beam onto the target.',
  icon: '🔦',
  color: '#06b6d4',
  wallCompression: 'never',
  supportsUndo: true,
  useMoveLimit: true,
  tutorialSteps: LASER_TUTORIAL_STEPS,
  renderDemo: renderLaserDemo,
  getLevels: () => LASER_LEVELS,
  worlds: LASER_WORLDS,
  supportsWorkshop: false,
  overlayText: { win: 'TARGET HIT!', loss: 'OUT OF MOVES' },

  tileRenderer: {
    type: 'laser',
    hidePipes: true,
    symbolSize: '1.3rem',
    getColors: getTileColors,
    getSymbol: getTileSymbol,
  },

  onTileTap(x, y, tiles, gridSize): TapResult | null {
    const tile = tiles.find((t) => t.x === x && t.y === y);
    if (!tile || tile.displayData?.kind !== 'mirror') return null;

    const rot = (tile.displayData?.rotation as number) ?? 0;
    const rotated = tiles.map((t) =>
      t.x === x && t.y === y
        ? {
            ...t,
            justRotated: true,
            displayData: { ...t.displayData, rotation: rot === 0 ? 1 : 0 },
          }
        : t
    );

    return { tiles: withBeamApplied(rotated, gridSize), valid: true };
  },

  checkWin(tiles, _goalNodes, _moves, _maxMoves): WinResult {
    const gridSize = Math.round(Math.sqrt(tiles.length));
    const { hitTarget } = traceLaser(tiles, gridSize);
    return { won: hitTarget, reason: hitTarget ? 'Target hit!' : undefined };
  },

  checkLoss(tiles, _wallOffset, moves, maxMoves): { lost: boolean; reason?: string } {
    if (moves >= maxMoves) {
      const gridSize = Math.round(Math.sqrt(tiles.length));
      if (!traceLaser(tiles, gridSize).hitTarget) {
        return { lost: true, reason: 'Out of rotations!' };
      }
    }
    return { lost: false };
  },

  getWinTiles(tiles): Set<string> {
    const gridSize = Math.round(Math.sqrt(tiles.length));
    const { beamKeys } = traceLaser(tiles, gridSize);
    for (const t of tiles) {
      const k = t.displayData?.kind as string;
      if (k === 'source' || k === 'target') beamKeys.add(`${t.x},${t.y}`);
    }
    return beamKeys;
  },

  getNotification(_tiles, moves, _modeState) {
    if (moves === 1) return '🔦 First rotation!';
    return null;
  },

  statsLabels: { moves: 'ROTATIONS' },
  statsDisplay: [{ type: 'moves' }],
};
