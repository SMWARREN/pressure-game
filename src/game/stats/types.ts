// PRESSURE - Stats System Types
// Events are append-only. Backends decide where they live.

/* ═══════════════════════════════════════════════════════════════════════════
   EVENTS
   Every fact the engine can record. Add new event types here; the backend
   interface doesn't change.
═══════════════════════════════════════════════════════════════════════════ */

interface BaseEvent {
  /** Unix milliseconds */
  ts: number;
  /** Mode that was active when the event fired */
  modeId: string;
  /** Level that was loaded when the event fired */
  levelId: number;
  /** Random ID shared across all events in one browser tab session */
  sessionId: string;
}

/** Fired when status transitions from anything → 'playing' */
export interface GameStartEvent extends BaseEvent {
  type: 'game_start';
}

/** A single tap recorded during gameplay for move-by-move replay */
export interface MoveRecord {
  x: number;
  y: number;
  /** Milliseconds elapsed from game start at the time of the tap */
  t: number;
}

/** Fired when status transitions from 'playing' → 'won' or 'lost' */
export interface GameEndEvent extends BaseEvent {
  type: 'game_end';
  outcome: 'won' | 'lost';
  moves: number;
  elapsedSeconds: number;
  score: number;
  lossReason: string | null;
  /** Full move log for replay. Empty array on legacy events recorded before this field existed. */
  moveLog: MoveRecord[];
}

export type StatEvent = GameStartEvent | GameEndEvent;
export type StatEventType = StatEvent['type'];

/* ═══════════════════════════════════════════════════════════════════════════
   BACKEND INTERFACE
   Implement this to store events anywhere:
     - LocalStorageStatsBackend  (ships by default)
     - InMemoryStatsBackend      (testing / ephemeral)
     - ServerStatsBackend        (POST to an API endpoint)
     - ElectronStatsBackend      (write JSON to disk via IPC)
     - IndexedDBStatsBackend     (unlimited storage, structured queries)
═══════════════════════════════════════════════════════════════════════════ */

export interface StatsBackend {
  /** Append a single event to the store. Must not throw. */
  record(event: StatEvent): void;

  /** Return all stored events in insertion order. */
  getAll(): StatEvent[];

  /** Wipe all stored data. */
  clear(): void;
}
