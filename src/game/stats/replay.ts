/**
 * ReplayEngine — re-runs recorded moves against the initial level state
 * to produce a sequence of snapshots for step-by-step playback.
 */
import { getModeById } from '@/game/modes';
import { LEVELS } from '@/game/levels';
import type { GameEndEvent, MoveRecord } from './types';
import type { Tile, Level } from '@/game/types';

export interface ReplaySnapshot {
  tiles: Tile[];
  score: number;
  modeState: Record<string, unknown>;
  /** Which tile was tapped to reach this snapshot (null = initial state) */
  tappedPos: { x: number; y: number } | null;
  /** Index into moveLog (-1 = initial state before any moves) */
  moveIndex: number;
  /** Elapsed ms from game start at the time of this move */
  elapsed: number;
}

export class ReplayEngine {
  readonly snapshots: ReplaySnapshot[];
  readonly event: GameEndEvent;
  readonly level: Level;

  /** Look up a built-in level by ID. Returns null if not found. */
  static findLevel(levelId: number): Level | null {
    return LEVELS.find((l) => l.id === levelId) ?? null;
  }

  constructor(event: GameEndEvent, level: Level) {
    this.event = event;
    this.level = level;
    this.snapshots = this.computeSnapshots();
  }

  /** Number of moves in the replay (snapshots.length - 1, excluding initial state) */
  get totalMoves(): number {
    return this.snapshots.length - 1;
  }

  private computeSnapshots(): ReplaySnapshot[] {
    const mode = getModeById(this.event.modeId);
    const moveLog: MoveRecord[] = this.event.moveLog ?? [];

    // Deep-copy initial tile state from the level
    let tiles: Tile[] = this.level.tiles.map((t) => ({
      ...t,
      connections: [...t.connections],
    }));
    let score = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let modeState: Record<string, unknown> = mode.initialState
      ? (mode.initialState({} as any) as Record<string, unknown>)
      : {};

    const snapshots: ReplaySnapshot[] = [
      {
        tiles: tiles.map((t) => ({ ...t, connections: [...t.connections] })),
        score,
        modeState: { ...modeState },
        tappedPos: null,
        moveIndex: -1,
        elapsed: 0,
      },
    ];

    for (let i = 0; i < moveLog.length; i++) {
      const move = moveLog[i];
      const result = mode.onTileTap(move.x, move.y, tiles, this.level.gridSize, modeState);

      if (result?.valid) {
        tiles = result.tiles;
        score += result.scoreDelta ?? 0;
        modeState = (result.customState ?? modeState) as Record<string, unknown>;
      }

      snapshots.push({
        tiles: tiles.map((t) => ({ ...t, connections: [...t.connections] })),
        score,
        modeState: { ...modeState },
        tappedPos: { x: move.x, y: move.y },
        moveIndex: i,
        elapsed: move.t,
      });
    }

    return snapshots;
  }
}
