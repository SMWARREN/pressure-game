// BLOCKING ADDON — Shared mechanic for tiles that temporarily block player interaction.
//
// Both Candy mode (🧊 frozen tiles) and Shopping Spree mode (🦹 thief tiles) use
// the same two-phase pattern:
//
//   onTick  → spawnBlockers   : randomly place N blocker tiles each second
//   onTileTap → unblockNearGroup : big combos (4+) clear nearby blockers by radius
//
// Usage:
//   import { spawnBlockers, unblockNearGroup } from '../blockingAddon';

import { Tile } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SpawnConfig {
  /** Probability (0–1) that spawning succeeds this tick. Use 1 to always spawn. */
  spawnChance: number;
  /** Max number of new blockers to place in this tick. */
  maxCount: number;
}

// ── spawnBlockers ─────────────────────────────────────────────────────────────

/**
 * Try to place blocking tiles on the board this tick.
 *
 * - Runs the random `spawnChance` gate first (pass 1 to always spawn).
 * - Picks up to `config.maxCount` interactive tiles that aren't already blocked.
 * - Marks them `canRotate: false` with `displayData[blockFlag]: true`.
 *
 * Returns `{ tiles, newPositions }` on success, or `null` if the chance gate
 * fails or no eligible candidates exist.
 */
export function spawnBlockers(
  tiles: Tile[],
  blockFlag: string,
  existingBlocked: Set<string>,
  config: SpawnConfig
): { tiles: Tile[]; newPositions: string[] } | null {
  if (Math.random() > config.spawnChance) return null;

  const candidates = tiles.filter((t) => t.canRotate && !existingBlocked.has(`${t.x},${t.y}`));
  if (candidates.length === 0) return null;

  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const newPositions: string[] = [];

  for (let i = 0; i < Math.min(config.maxCount, shuffled.length); i++) {
    newPositions.push(`${shuffled[i].x},${shuffled[i].y}`);
  }
  if (newPositions.length === 0) return null;

  const newSet = new Set(newPositions);
  return {
    tiles: tiles.map((t) =>
      newSet.has(`${t.x},${t.y}`)
        ? { ...t, canRotate: false, displayData: { ...t.displayData, [blockFlag]: true } }
        : t
    ),
    newPositions,
  };
}

// ── unblockNearGroup ──────────────────────────────────────────────────────────

/**
 * After clearing a group, unblock nearby tiles that carry `blockFlag`.
 *
 * Radius rules — scaled from `minGroupSize` (default 4, use 3 for easier worlds):
 *   - group.length < minGroupSize          → no unblocking
 *   - group.length = minGroupSize or +1    → radius 1 (immediate neighbours)
 *   - group.length ≥ minGroupSize + 2      → radius 2 (wider blast)
 *
 * Returns updated remaining tiles and the set of positions that were unblocked.
 */
export function unblockNearGroup(
  group: Tile[],
  remainingTiles: Tile[],
  blockFlag: string,
  minGroupSize: number = 4
): { tiles: Tile[]; unblocked: Set<string> } {
  const candidateKeys = new Set<string>();

  if (group.length >= minGroupSize) {
    const radius = group.length >= minGroupSize + 2 ? 2 : 1;
    for (const cleared of group) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          candidateKeys.add(`${cleared.x + dx},${cleared.y + dy}`);
        }
      }
    }
  }

  const actuallyUnblocked = new Set<string>();
  const tiles = remainingTiles.map((t) => {
    const key = `${t.x},${t.y}`;
    if ((t.displayData as Record<string, unknown>)?.[blockFlag] && candidateKeys.has(key)) {
      actuallyUnblocked.add(key);
      return { ...t, canRotate: true, displayData: { ...t.displayData, [blockFlag]: false } };
    }
    return t;
  });

  return { tiles, unblocked: actuallyUnblocked };
}
