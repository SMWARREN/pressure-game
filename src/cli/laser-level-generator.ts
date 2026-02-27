// LASER RELAY - Level Generator CLI
// Generates and verifies laser relay levels using actual game logic
// Run with: npx tsx src/cli/laser-level-generator.ts

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Types ────────────────────────────────────────────────────────────────────
interface Tile {
  id: string;
  type: 'path' | 'wall';
  x: number;
  y: number;
  connections: string[];
  canRotate: boolean;
  isGoalNode: boolean;
  displayData?: {
    kind: string;
    dir: string;
    rotation: number;
    beamOn: boolean;
    portalId?: string;
  };
}

interface Level {
  id: number;
  name: string;
  world: number;
  gridSize: number;
  tiles: Tile[];
  goalNodes: { x: number; y: number }[];
  maxMoves: number;
  compressionDelay: number;
  compressionEnabled: boolean;
  gridCols?: number;
  gridRows?: number;
}

// ── Beam Tracing Logic ────────────────────────────────────────────────────────
const SLASH: Record<string, string> = { right: 'up', up: 'right', left: 'down', down: 'left' };
const BACK: Record<string, string> = { right: 'down', down: 'right', left: 'up', up: 'left' };
const STEP: Record<string, { dx: number; dy: number }> = {
  right: { dx: 1, dy: 0 },
  left: { dx: -1, dy: 0 },
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
};

function traceBeam(
  tiles: Tile[],
  gridSize: number,
  gridCols?: number,
  gridRows?: number
): { beam: Set<string>; hitsTarget: boolean; path: { x: number; y: number; dir: string }[] } {
  const cols = gridCols ?? gridSize;
  const rows = gridRows ?? gridSize;
  const map = new Map<string, Tile>();
  for (const t of tiles) map.set(`${t.x},${t.y}`, t);
  const source = tiles.find((t) => t.displayData?.kind === 'source');

  if (!source) return { beam: new Set(), hitsTarget: false, path: [] };

  // Build portal map
  const portalMap = new Map<string, Tile[]>();
  for (const t of tiles) {
    if (t.displayData?.kind === 'portal') {
      const portalId = t.displayData?.portalId as string;
      if (portalId) {
        if (!portalMap.has(portalId)) portalMap.set(portalId, []);
        portalMap.get(portalId)!.push(t);
      }
    }
  }

  let x = source.x;
  let y = source.y;
  let dir = source.displayData!.dir as string;
  const beam = new Set<string>();
  const path: { x: number; y: number; dir: string }[] = [];
  let steps = 0;
  const maxSteps = cols * rows * 8;
  let hitsTarget = false;

  while (steps++ < maxSteps) {
    const { dx, dy } = STEP[dir];
    x += dx;
    y += dy;

    // Check bounds - beam exits grid
    if (x < 0 || y < 0 || x >= cols || y >= rows) break;

    const key = `${x},${y}`;
    const tile = map.get(key);

    // No tile at this position = empty space, beam continues
    if (!tile) {
      beam.add(key);
      continue;
    }

    const kind = tile.displayData?.kind as string;

    // Wall or source blocks beam
    if (kind === 'wall' || kind === 'source') break;

    beam.add(key);
    path.push({ x, y, dir });

    // Target - beam hits!
    if (kind === 'target') {
      hitsTarget = true;
      break;
    }

    // Mirror - change direction
    if (kind === 'mirror') {
      const rot = tile.displayData?.rotation as number;
      const nd = rot === 0 ? SLASH[dir] : BACK[dir];
      if (!nd) break;
      dir = nd;
    }

    // Portal - teleport beam
    if (kind === 'portal') {
      const portalId = tile.displayData?.portalId as string;
      if (portalId) {
        const portals = portalMap.get(portalId) || [];
        const otherPortal = portals.find((t) => t.x !== x || t.y !== y);
        if (otherPortal) {
          x = otherPortal.x;
          y = otherPortal.y;
          beam.add(`${x},${y}`);
        }
      }
    }
  }

  return { beam, hitsTarget, path };
}

// ── Level Builder ─────────────────────────────────────────────────────────────
function buildLevel(
  id: number,
  name: string,
  world: number,
  maxMoves: number,
  rows: string[],
  gridCols?: number
): Level {
  const gridSize = rows.length;
  const cols = gridCols ?? rows[0]?.split(' ').length ?? gridSize;
  const tiles: Tile[] = [];

  for (let y = 0; y < gridSize; y++) {
    const chars = rows[y].split(' ');
    for (let x = 0; x < chars.length; x++) {
      const ch = chars[x] ?? '.';
      let kind = 'empty',
        dir = 'right',
        rotation = 0,
        canRotate = false,
        portalId: string | undefined;

      switch (ch) {
        case 'S':
          kind = 'source';
          dir = 'right';
          break;
        case 'V':
          kind = 'source';
          dir = 'down';
          break;
        case 'U':
          kind = 'source';
          dir = 'up';
          break;
        case 'L':
          kind = 'source';
          dir = 'left';
          break;
        case 'T':
          kind = 'target';
          break;
        case '#':
          kind = 'wall';
          break;
        case '/':
          kind = 'mirror';
          rotation = 0;
          canRotate = true;
          break;
        case '\\':
        case '?':
          kind = 'mirror';
          rotation = 1;
          canRotate = true;
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          kind = 'portal';
          portalId = ch;
          break;
      }

      if (kind !== 'empty') {
        tiles.push({
          id: `lr${id}-${x}-${y}`,
          type: 'path',
          x,
          y,
          connections: [],
          canRotate,
          isGoalNode: kind === 'target',
          displayData: { kind, dir, rotation, beamOn: false, portalId },
        });
      }
    }
  }

  return {
    id,
    name,
    world,
    gridSize,
    tiles,
    goalNodes: [],
    maxMoves,
    compressionDelay: 999999,
    compressionEnabled: false,
    gridCols: cols,
    gridRows: gridSize,
  };
}

// ── Level Verification ────────────────────────────────────────────────────────
function verifyLevel(
  level: Level,
  _levelNum: number
): {
  valid: boolean;
  initialHits: boolean;
  solvedHits: boolean;
  mirrorCount: number;
  error: string;
} {
  const result = {
    valid: false,
    initialHits: false,
    solvedHits: false,
    mirrorCount: 0,
    error: '',
  };

  // Count mirrors
  const mirrors = level.tiles.filter((t) => t.displayData?.kind === 'mirror');
  result.mirrorCount = mirrors.length;

  if (mirrors.length === 0) {
    result.error = 'No mirrors found';
    return result;
  }

  // Check initial state (all mirrors start as \ rotation=1)
  const initialResult = traceBeam(level.tiles, level.gridSize, level.gridCols, level.gridRows);
  result.initialHits = initialResult.hitsTarget;

  if (result.initialHits) {
    result.error = 'Beam hits target in initial state (level already solved)';
    return result;
  }

  // Check solved state (flip all mirrors to / rotation=0)
  const solvedTiles = level.tiles.map((t) => {
    if (t.displayData?.kind === 'mirror') {
      return {
        ...t,
        displayData: { ...t.displayData, rotation: 0 },
      };
    }
    return t;
  });

  const solvedResult = traceBeam(solvedTiles, level.gridSize, level.gridCols, level.gridRows);
  result.solvedHits = solvedResult.hitsTarget;

  if (!result.solvedHits) {
    result.error = 'Beam does NOT hit target when all mirrors are / (unsolvable)';
    return result;
  }

  result.valid = true;
  return result;
}

// ── Procedural Level Generation ───────────────────────────────────────────────

interface GeneratedLevel {
  id: number;
  name: string;
  world: number;
  maxMoves: number;
  rows: string[];
}

/**
 * Generate a staircase level by SIMULATING the beam path
 *
 * With / mirrors (rotation 0): right→up, up→right
 * With \ mirrors (rotation 1): right→down, up→left
 *
 * For a staircase going up-right with / mirrors:
 * - Beam goes right, hits /, goes up
 * - Beam goes up, hits /, goes right
 * - etc.
 */
function generateStaircaseLevel(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  mirrorCount: number,
  maxMoves: number
): GeneratedLevel | null {
  // Create empty grid
  const grid: string[][] = [];
  for (let y = 0; y < rows; y++) {
    grid.push(Array(cols).fill('.'));
  }

  // Place source at left edge, middle area
  const sourceY = Math.floor(rows / 2);
  grid[sourceY][0] = 'S';

  // Simulate beam path with / mirrors (solved state)
  // Start at source, going right
  let x = 0;
  let y = sourceY;
  let dir: 'right' | 'up' | 'left' | 'down' = 'right';

  const mirrorPositions: { x: number; y: number }[] = [];

  // Place mirrors along the path
  for (let i = 0; i < mirrorCount; i++) {
    // Move one step in current direction
    x += STEP[dir].dx;
    y += STEP[dir].dy;

    // Check bounds
    if (x < 1 || x >= cols - 1 || y < 1 || y >= rows - 1) break;

    // Place mirror here
    mirrorPositions.push({ x, y });
    grid[y][x] = '?'; // Will be \ initially, / when solved

    // Change direction based on / mirror behavior
    // / mirror: right→up, up→right, left→down, down→left
    if (dir === 'right') dir = 'up';
    else if (dir === 'up') dir = 'right';
    else if (dir === 'left') dir = 'down';
    else if (dir === 'down') dir = 'left';
  }

  if (mirrorPositions.length === 0) return null;

  // Place target at the position after the last mirror
  // Move one more step in the final direction
  const lastDir = dir;
  x += STEP[lastDir].dx;
  y += STEP[lastDir].dy;

  // Make sure target is in bounds
  if (x < 0 || x >= cols || y < 0 || y >= rows) {
    // Try to place target at a valid position
    const lastMirror = mirrorPositions[mirrorPositions.length - 1];
    x = lastMirror.x + 1;
    y = lastMirror.y;
    if (x >= cols) {
      x = lastMirror.x;
      y = Math.max(0, lastMirror.y - 1);
    }
  }

  if (x >= 0 && x < cols && y >= 0 && y < rows) {
    grid[y][x] = 'T';
  } else {
    return null; // Can't place target
  }

  return {
    id,
    name,
    world,
    maxMoves,
    rows: grid.map((r) => r.join(' ')),
  };
}

/**
 * Generate a zigzag level - beam goes right, then up, then right, etc.
 * But we need to ensure the path works with / mirrors
 */
function generateZigzagLevel(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  mirrorCount: number,
  maxMoves: number
): GeneratedLevel | null {
  const grid: string[][] = [];
  for (let y = 0; y < rows; y++) {
    grid.push(Array(cols).fill('.'));
  }

  // Place source at left edge, lower area
  const sourceY = rows - 2;
  grid[sourceY][0] = 'S';

  // For zigzag, we alternate between going right and up
  // With / mirrors: right→up, up→right
  // So mirrors alternate between turning beam up and right

  let x = 1;
  let y = sourceY;
  let goingRight = true;

  const mirrorPositions: { x: number; y: number }[] = [];

  for (let i = 0; i < mirrorCount; i++) {
    if (x >= cols - 1 || y < 1) break;

    mirrorPositions.push({ x, y });
    grid[y][x] = '?';

    if (goingRight) {
      // After / mirror, beam goes up
      // Next mirror should be above
      x += 1;
      y -= 2;
      goingRight = false;
    } else {
      // After / mirror, beam goes right
      // Next mirror should be to the right
      x += 2;
      y -= 1;
      goingRight = true;
    }
  }

  // Place target
  if (mirrorPositions.length > 0) {
    const last = mirrorPositions[mirrorPositions.length - 1];
    // After last / mirror, beam direction depends on what it was before
    // If we were going right before hitting it, beam goes up
    // If we were going up before hitting it, beam goes right

    // For simplicity, place target to the right of last mirror
    const targetX = Math.min(cols - 1, last.x + 1);
    grid[last.y][targetX] = 'T';
  } else {
    grid[1][cols - 1] = 'T';
  }

  return {
    id,
    name,
    world,
    maxMoves,
    rows: grid.map((r) => r.join(' ')),
  };
}

/**
 * Generate a level with walls
 */
function generateWalledLevel(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  mirrorCount: number,
  maxMoves: number
): GeneratedLevel | null {
  const grid: string[][] = [];
  for (let y = 0; y < rows; y++) {
    grid.push(Array(cols).fill('.'));
  }

  // Place source at left edge
  const sourceY = Math.floor(rows / 2);
  grid[sourceY][0] = 'S';

  // Add some walls in the middle
  const wallX = Math.floor(cols / 2);
  for (let wy = 0; wy < Math.floor(rows / 3); wy++) {
    grid[wy][wallX] = '#';
  }
  for (let wy = rows - Math.floor(rows / 3); wy < rows; wy++) {
    grid[wy][wallX] = '#';
  }

  // Generate staircase path avoiding walls
  let x = 1;
  let y = sourceY;
  let dir: 'right' | 'up' = 'right';

  const mirrorPositions: { x: number; y: number }[] = [];

  for (let i = 0; i < mirrorCount; i++) {
    // Skip if wall is here
    while (x < cols - 1 && grid[y] && grid[y][x] === '#') {
      x++;
    }

    if (x >= cols - 1 || y < 1 || y >= rows - 1) break;

    mirrorPositions.push({ x, y });
    grid[y][x] = '?';

    // Alternate direction
    if (dir === 'right') {
      x += 2;
      dir = 'up';
    } else {
      y -= 2;
      dir = 'right';
    }
  }

  // Place target
  if (mirrorPositions.length > 0) {
    const last = mirrorPositions[mirrorPositions.length - 1];
    const targetX = Math.min(cols - 1, last.x + 1);
    grid[Math.max(0, last.y - 1)][targetX] = 'T';
  } else {
    grid[1][cols - 1] = 'T';
  }

  return {
    id,
    name,
    world,
    maxMoves,
    rows: grid.map((r) => r.join(' ')),
  };
}

/**
 * Generate a level with portals
 * Portal teleports beam from one location to another
 *
 * Strategy: Create a staircase path, but insert a portal pair in the middle
 * The beam goes: source → mirrors → portal1 → portal2 → mirrors → target
 */
function generatePortalLevel(
  id: number,
  name: string,
  world: number,
  cols: number,
  rows: number,
  mirrorCount: number,
  maxMoves: number
): GeneratedLevel | null {
  const grid: string[][] = [];
  for (let y = 0; y < rows; y++) {
    grid.push(Array(cols).fill('.'));
  }

  // Place source at left edge
  const sourceY = Math.floor(rows / 2);
  grid[sourceY][0] = 'S';

  // Simulate beam path with / mirrors (solved state)
  // Start at source, going right
  let x = 0;
  let y = sourceY;
  let dir: 'right' | 'up' | 'left' | 'down' = 'right';

  const mirrorPositions: { x: number; y: number }[] = [];
  const halfMirrors = Math.floor(mirrorCount / 2);

  // Place first half of mirrors
  for (let i = 0; i < halfMirrors; i++) {
    x += STEP[dir].dx;
    y += STEP[dir].dy;

    if (x < 1 || x >= cols - 1 || y < 1 || y >= rows - 1) break;

    mirrorPositions.push({ x, y });
    grid[y][x] = '?';

    if (dir === 'right') dir = 'up';
    else if (dir === 'up') dir = 'right';
    else if (dir === 'left') dir = 'down';
    else if (dir === 'down') dir = 'left';
  }

  // Place portal1 at current beam position
  const portal1X = x + STEP[dir].dx;
  const portal1Y = y + STEP[dir].dy;

  if (portal1X < 0 || portal1X >= cols || portal1Y < 0 || portal1Y >= rows) {
    return generateStaircaseLevel(id, name, world, cols, rows, mirrorCount, maxMoves);
  }

  grid[portal1Y][portal1X] = '1';

  // Place portal2 at a different location (upper right area)
  const portal2X = cols - 3;
  const portal2Y = 2;

  if (portal2X < 0 || portal2X >= cols || portal2Y < 0 || portal2Y >= rows) {
    return generateStaircaseLevel(id, name, world, cols, rows, mirrorCount, maxMoves);
  }

  grid[portal2Y][portal2X] = '1';

  // Continue beam from portal2
  x = portal2X;
  y = portal2Y;
  // Beam continues in same direction after exiting portal

  // Place remaining mirrors
  for (let i = 0; i < mirrorCount - halfMirrors; i++) {
    x += STEP[dir].dx;
    y += STEP[dir].dy;

    if (x < 1 || x >= cols - 1 || y < 1 || y >= rows - 1) break;

    mirrorPositions.push({ x, y });
    grid[y][x] = '?';

    if (dir === 'right') dir = 'up';
    else if (dir === 'up') dir = 'right';
    else if (dir === 'left') dir = 'down';
    else if (dir === 'down') dir = 'left';
  }

  // Place target at final position
  x += STEP[dir].dx;
  y += STEP[dir].dy;

  if (x < 0 || x >= cols || y < 0 || y >= rows) {
    // Fallback: place target at top-right
    x = cols - 1;
    y = 1;
  }

  grid[y][x] = 'T';

  if (mirrorPositions.length === 0) return null;

  return {
    id,
    name,
    world,
    maxMoves,
    rows: grid.map((r) => r.join(' ')),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

function printBoard(level: Level, showSolved: boolean = false): void {
  // If showing solved state, flip mirrors
  let tiles = level.tiles;
  if (showSolved) {
    tiles = tiles.map((t) => {
      if (t.displayData?.kind === 'mirror') {
        return { ...t, displayData: { ...t.displayData, rotation: 0 } };
      }
      return t;
    });
  }

  const { beam, hitsTarget } = traceBeam(tiles, level.gridSize, level.gridCols, level.gridRows);

  const tileMap = new Map<string, Tile>();
  for (const t of tiles) {
    tileMap.set(`${t.x},${t.y}`, t);
  }

  const cols = level.gridCols || level.gridSize;
  const rows = level.gridRows || level.gridSize;

  console.log(`\n  ┌${'──'.repeat(cols)}┐`);

  for (let y = 0; y < rows; y++) {
    let row = '  │';
    for (let x = 0; x < cols; x++) {
      const tile = tileMap.get(`${x},${y}`);
      const isBeam = beam.has(`${x},${y}`);

      if (!tile) {
        row += isBeam ? `${colors.yellow}██${colors.reset}` : '  ';
      } else {
        const kind = tile.displayData?.kind;
        const rot = tile.displayData?.rotation;

        let char = '  ';
        if (kind === 'source') char = `${colors.cyan}S▶${colors.reset}`;
        else if (kind === 'target') char = `${colors.green}T★${colors.reset}`;
        else if (kind === 'wall') char = `${colors.red}██${colors.reset}`;
        else if (kind === 'mirror') {
          const mirrorChar = rot === 0 ? '/' : '\\';
          char = isBeam
            ? `${colors.yellow}${mirrorChar}${mirrorChar}${colors.reset}`
            : `${colors.magenta}${mirrorChar}${mirrorChar}${colors.reset}`;
        } else if (kind === 'portal') {
          const pid = tile.displayData?.portalId;
          char = `${colors.blue}[${pid}]${colors.reset}`;
        } else char = isBeam ? `${colors.yellow}~~${colors.reset}` : '  ';

        row += char;
      }
    }
    row += '│';
    console.log(row);
  }

  console.log(`  └${'──'.repeat(cols)}┘`);
  console.log(
    `  Beam ${hitsTarget ? `${colors.green}HITS${colors.reset} target` : `${colors.red}MISSES${colors.reset} target`}`
  );
}

async function main() {
  console.log(
    `${colors.bold}${colors.magenta}═══════════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.bold}${colors.magenta}  LASER RELAY LEVEL GENERATOR${colors.reset}`);
  console.log(
    `${colors.bold}${colors.magenta}═══════════════════════════════════════${colors.reset}\n`
  );

  // Define level configurations
  // Each: [id, name, world, cols, rows, mirrors, maxMoves, type]
  const levelConfigs: [
    number,
    string,
    number,
    number,
    number,
    number,
    number,
    'staircase' | 'portal' | 'zigzag' | 'wall',
  ][] = [
    // World 1: PRISM - Small levels, 1-3 mirrors
    [801, 'First Light', 1, 5, 5, 1, 5, 'staircase'],
    [802, 'Elbow', 1, 5, 5, 2, 7, 'staircase'],
    [803, 'S-Curve', 1, 6, 5, 2, 8, 'staircase'],
    [804, 'Steps', 1, 6, 6, 3, 10, 'staircase'],
    [805, 'Corner Shot', 1, 6, 6, 2, 8, 'staircase'],
    [806, 'The Hook', 1, 7, 6, 3, 10, 'staircase'],

    // World 2: REFRACT - Medium levels, 2-4 mirrors
    [807, 'Long Ride', 2, 8, 6, 2, 10, 'staircase'],
    [808, 'Down the Chute', 2, 8, 7, 3, 12, 'staircase'],
    [809, 'The Funnel', 2, 8, 7, 4, 14, 'staircase'],
    [810, 'Maze Runner', 2, 9, 7, 3, 12, 'staircase'],
    [811, 'Zigzag', 2, 9, 8, 4, 14, 'staircase'],
    [812, 'Wall Dance', 2, 8, 7, 3, 12, 'staircase'],
    [813, 'The Switchback', 2, 10, 8, 4, 16, 'staircase'],

    // World 3: GAUNTLET - Larger levels, 3-5 mirrors
    [814, 'Spiral', 3, 10, 8, 4, 16, 'staircase'],
    [815, 'Corner to Corner', 3, 10, 9, 5, 18, 'staircase'],
    [816, 'The Labyrinth', 3, 10, 9, 4, 16, 'staircase'],
    [817, 'Pinball', 3, 11, 9, 5, 18, 'staircase'],
    [818, 'The Maze', 3, 11, 10, 5, 20, 'staircase'],
    [819, 'Serpent', 3, 12, 10, 6, 22, 'staircase'],
    [820, 'The Web', 3, 12, 10, 5, 20, 'staircase'],

    // World 4: NEXUS - Portal levels
    [821, 'Portal Jump', 4, 10, 8, 2, 14, 'portal'],
    [822, 'Portal Maze', 4, 11, 9, 3, 16, 'portal'],
    [823, 'Double Portal', 4, 12, 10, 4, 18, 'portal'],
    [824, 'Portal Chase', 4, 12, 10, 3, 16, 'portal'],
    [825, 'Mirror Portal', 4, 11, 9, 4, 18, 'portal'],
    [826, 'The Gauntlet', 4, 13, 10, 5, 20, 'portal'],
    [827, 'Portal Symphony', 4, 14, 11, 5, 22, 'portal'],

    // World 5: APEX - Master Challenges
    [828, 'Grand Staircase', 5, 14, 12, 7, 28, 'staircase'],
    [829, 'The Fortress', 5, 14, 12, 6, 26, 'staircase'],
    [830, 'Apex Portal', 5, 15, 12, 6, 28, 'staircase'],
    [831, 'The Ultimate', 5, 16, 14, 8, 32, 'staircase'],
    [832, "Master's Path", 5, 16, 14, 7, 30, 'staircase'],
    [833, 'Lightning Strike', 5, 15, 12, 6, 26, 'staircase'],
    [834, 'The Maze Master', 5, 16, 13, 7, 30, 'staircase'],
    [835, 'Final Frontier', 5, 18, 14, 9, 36, 'staircase'],
  ];

  console.log(`Generating ${levelConfigs.length} levels...\n`);

  const validLevels: Level[] = [];
  const invalidLevels: { id: number; name: string; error: string }[] = [];

  for (const [id, name, world, cols, rows, mirrors, maxMoves, type] of levelConfigs) {
    console.log(`${colors.bold}Level ${id} "${name}"${colors.reset}`);
    console.log(`  Type: ${type}, Size: ${cols}x${rows}, Mirrors: ${mirrors}`);

    // Generate level based on type
    let generated: GeneratedLevel | null = null;

    switch (type) {
      case 'staircase':
        generated = generateStaircaseLevel(id, name, world, cols, rows, mirrors, maxMoves);
        break;
      case 'portal':
        generated = generatePortalLevel(id, name, world, cols, rows, mirrors, maxMoves);
        break;
      case 'zigzag':
        generated = generateZigzagLevel(id, name, world, cols, rows, mirrors, maxMoves);
        break;
      case 'wall':
        generated = generateWalledLevel(id, name, world, cols, rows, mirrors, maxMoves);
        break;
    }

    if (!generated) {
      console.log(`  ${colors.red}✗ FAILED TO GENERATE${colors.reset}\n`);
      invalidLevels.push({ id, name, error: 'Failed to generate' });
      continue;
    }

    const level = buildLevel(
      generated.id,
      generated.name,
      generated.world,
      generated.maxMoves,
      generated.rows
    );
    const verification = verifyLevel(level, id);

    console.log(`  Mirrors: ${verification.mirrorCount}`);

    if (verification.valid) {
      console.log(`  ${colors.green}✓ VALID${colors.reset}`);
      validLevels.push(level);

      // Show initial state
      console.log(`\n  ${colors.bold}Initial State (mirrors as \\):${colors.reset}`);
      printBoard(level, false);

      // Show solved state
      console.log(`\n  ${colors.bold}Solved State (mirrors as /):${colors.reset}`);
      printBoard(level, true);
    } else {
      console.log(`  ${colors.red}✗ INVALID: ${verification.error}${colors.reset}`);
      invalidLevels.push({ id, name, error: verification.error });

      // Show for debugging
      console.log(`\n  ${colors.bold}Initial State:${colors.reset}`);
      printBoard(level, false);
      console.log(`\n  ${colors.bold}Solved State:${colors.reset}`);
      printBoard(level, true);
    }
    console.log('');
  }

  // Summary
  console.log(`\n${colors.bold}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}SUMMARY${colors.reset}`);
  console.log(`${colors.bold}═══════════════════════════════════════${colors.reset}\n`);
  console.log(`Valid levels: ${colors.green}${validLevels.length}${colors.reset}`);
  console.log(`Invalid levels: ${colors.red}${invalidLevels.length}${colors.reset}`);

  if (invalidLevels.length > 0) {
    console.log(`\n${colors.red}Invalid levels:${colors.reset}`);
    for (const { id, name, error } of invalidLevels) {
      console.log(`  ${id} "${name}": ${error}`);
    }
  }

  // Generate TypeScript output for valid levels
  if (validLevels.length > 0) {
    console.log(`\n${colors.green}Generated ${validLevels.length} valid levels!${colors.reset}`);

    // Write to levels.ts file
    const levelsPath = path.join(__dirname, '../game/modes/laserRelay/levels.ts');

    const fileContent = `// LASER RELAY LEVELS - Auto-generated by laser-level-generator.ts
// DO NOT EDIT MANUALLY - Run: npx tsx src/cli/laser-level-generator.ts

import type { Level } from '../../types';

// World 1: PRISM - Small levels, 1-3 mirrors
// World 2: REFRACT - Medium levels, 2-4 mirrors  
// World 3: GAUNTLET - Larger levels, 3-5 mirrors
// World 4: NEXUS - Portal levels
// World 5: APEX - Master Challenges

export const LASER_LEVELS: Level[] = [
${validLevels.map((level) => `  ${JSON.stringify(level)}`).join(',\n')}
];

export const LASER_WORLDS = [
  { id: 1, name: 'PRISM', tagline: 'Small levels, 1-3 mirrors', color: '#06b6d4', icon: '🔷' },
  { id: 2, name: 'REFRACT', tagline: 'Medium levels, 2-4 mirrors', color: '#8b5cf6', icon: '💎' },
  { id: 3, name: 'GAUNTLET', tagline: 'Larger levels, 3-5 mirrors', color: '#f59e0b', icon: '⚡' },
  { id: 4, name: 'NEXUS', tagline: 'Portal challenges', color: '#ec4899', icon: '🌀' },
  { id: 5, name: 'APEX', tagline: 'Master challenges', color: '#ef4444', icon: '🏆' },
];

// Level lookup by ID
export const LASER_LEVEL_MAP = new Map<number, Level>(
  LASER_LEVELS.map(level => [level.id, level])
);

// Get levels by world
export function getLevelsByWorld(world: number): Level[] {
  return LASER_LEVELS.filter(level => level.world === world);
}

// Get total level count
export function getTotalLevelCount(): number {
  return LASER_LEVELS.length;
}
`;

    fs.writeFileSync(levelsPath, fileContent);
    console.log(
      `\n${colors.green}✓ Written ${validLevels.length} levels to ${levelsPath}${colors.reset}`
    );
  }
}

main().catch(console.error);
