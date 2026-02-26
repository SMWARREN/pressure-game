// PRESSURE - Persistence System
// Handles saving and loading game state to/from localStorage.

import type { GameState } from '../types';
import type { PersistedState } from './types';

/**
 * Default persisted state values
 */
const DEFAULT_PERSISTED: PersistedState = {
  completedLevels: [],
  bestMoves: {},
  showTutorial: true,
  generatedLevels: [],
  currentModeId: 'classic',
  seenTutorials: ['classic'],
  animationsEnabled: true,
  lastPlayedLevelId: {},
};

/**
 * Persistence system that handles saving and loading game state.
 */
export class PersistenceSystem {
  private storageKey: string;

  constructor(storageKey: string = 'pressure_save_v3') {
    this.storageKey = storageKey;
  }

  /**
   * Load persisted state from localStorage
   */
  load(): PersistedState {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return { ...DEFAULT_PERSISTED };

      const p = JSON.parse(raw);
      return {
        completedLevels: p.completedLevels || [],
        bestMoves: p.bestMoves || {},
        showTutorial: p.showTutorial !== false,
        generatedLevels: p.generatedLevels || [],
        currentModeId: p.currentModeId || DEFAULT_PERSISTED.currentModeId,
        seenTutorials:
          p.seenTutorials || (p.showTutorial === false ? [DEFAULT_PERSISTED.currentModeId] : []),
        animationsEnabled: p.animationsEnabled !== false,
        lastPlayedLevelId: p.lastPlayedLevelId ?? {},
      };
    } catch {
      return { ...DEFAULT_PERSISTED };
    }
  }

  /**
   * Save state to localStorage
   */
  save(state: GameState): void {
    if (typeof window === 'undefined') return;

    try {
      const payload: PersistedState = this.buildPayload(state);
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch {
      // Silently fail if storage isn't available
    }
  }

  /**
   * Build the persistence payload from game state
   */
  buildPayload(state: GameState): PersistedState {
    return {
      completedLevels: state.completedLevels,
      bestMoves: state.bestMoves,
      showTutorial: state.showTutorial,
      generatedLevels: state.generatedLevels,
      currentModeId: state.currentModeId,
      seenTutorials: state.seenTutorials,
      animationsEnabled: state.animationsEnabled,
      lastPlayedLevelId: state.lastPlayedLevelId,
    };
  }

  /**
   * Clear all persisted data
   */
  clear(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Silently fail
    }
  }

  /**
   * Update the storage key
   */
  setStorageKey(key: string): void {
    this.storageKey = key;
  }

  /**
   * Get the current storage key
   */
  getStorageKey(): string {
    return this.storageKey;
  }
}

/**
 * Create a persistence system instance
 */
export function createPersistenceSystem(storageKey?: string): PersistenceSystem {
  return new PersistenceSystem(storageKey);
}
