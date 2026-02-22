// PRESSURE - Stats Engine
// Subscribes to the Zustand store externally and emits typed events to
// whatever backend is registered. No changes to store.ts required.

import { useGameStore } from '../store';
import type { StatsBackend, StatEvent, GameStartEvent, GameEndEvent } from './types';
import type { GameState } from '../types';

// Stable across the page's lifetime — groups events from the same browser session
const SESSION_ID = Math.random().toString(36).slice(2, 10);

export class StatsEngine {
  private backend: StatsBackend;
  private unsubscribe: (() => void) | null = null;

  constructor(backend: StatsBackend) {
    this.backend = backend;
  }

  /** Swap the active backend at runtime without restarting the engine. */
  setBackend(backend: StatsBackend): void {
    this.backend = backend;
  }

  getBackend(): StatsBackend {
    return this.backend;
  }

  /** Wire into the store. Call once at app startup. Idempotent. */
  start(): void {
    if (this.unsubscribe) return;
    this.unsubscribe = useGameStore.subscribe((state, prev) =>
      this.onStateChange(state, prev)
    );
  }

  /** Stop listening. Useful for testing teardown. */
  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private emit(event: StatEvent): void {
    try {
      this.backend.record(event);
    } catch (err) {
      console.warn('[StatsEngine] backend.record threw:', err);
    }
  }

  private onStateChange(state: GameState, prev: GameState): void {
    if (!state.currentLevel) return;

    const base = {
      ts: Date.now(),
      modeId: state.currentModeId,
      levelId: state.currentLevel.id,
      sessionId: SESSION_ID,
    };

    // anything → playing
    if (prev.status !== 'playing' && state.status === 'playing') {
      this.emit({ ...base, type: 'game_start' } satisfies GameStartEvent);
    }

    // playing → won
    if (prev.status === 'playing' && state.status === 'won') {
      this.emit({
        ...base,
        type: 'game_end',
        outcome: 'won',
        moves: state.moves,
        elapsedSeconds: state.elapsedSeconds,
        score: state.score,
        lossReason: null,
      } satisfies GameEndEvent);
    }

    // playing → lost
    if (prev.status === 'playing' && state.status === 'lost') {
      this.emit({
        ...base,
        type: 'game_end',
        outcome: 'lost',
        moves: state.moves,
        elapsedSeconds: state.elapsedSeconds,
        score: state.score,
        lossReason: state.lossReason,
      } satisfies GameEndEvent);
    }
  }
}
