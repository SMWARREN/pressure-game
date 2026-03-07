// PRESSURE - Persistence System
// Handles saving and loading game state through pluggable backends.
// Supports localStorage, database, or custom storage implementations.

import type { GameState } from '../types';
import type { PersistedState } from './types';
import type { PersistenceBackend } from './backends';
import { LocalStorageBackend } from './backends';

/**
 * Default persisted state values
 */
const DEFAULT_PERSISTED: PersistedState = {
  completedLevels: [],
  bestMoves: {},
  bestTimes: {},
  showTutorial: true,
  generatedLevels: [],
  currentModeId: 'classic',
  seenTutorials: ['classic'],
  animationsEnabled: true,
  theme: 'dark',
  lastPlayedLevelId: {},
  editorEnabled: false,
};

/**
 * Persistence system that handles saving and loading game state.
 * Uses an injected backend for flexible storage (localStorage, database, etc.)
 */
export class PersistenceSystem {
  private storageKey: string;
  private readonly backend: PersistenceBackend;

  constructor(storageKey: string = 'pressure_save_v3', backend?: PersistenceBackend) {
    this.storageKey = storageKey;
    this.backend = backend ?? new LocalStorageBackend();
  }

  /**
   * Load persisted state from backend
   */
  load(): PersistedState {
    try {
      const raw = this.backend.getItem(this.storageKey);
      if (!raw) return { ...DEFAULT_PERSISTED };

      const p = JSON.parse(raw);
      return {
        completedLevels: p.completedLevels || [],
        bestMoves: p.bestMoves || {},
        bestTimes: p.bestTimes || {},
        showTutorial: p.showTutorial !== false,
        generatedLevels: p.generatedLevels || [],
        currentModeId: p.currentModeId || DEFAULT_PERSISTED.currentModeId,
        seenTutorials:
          p.seenTutorials || (p.showTutorial === false ? [DEFAULT_PERSISTED.currentModeId] : []),
        animationsEnabled: p.animationsEnabled !== false,
        theme: p.theme === 'light' ? 'light' : 'dark',
        lastPlayedLevelId: p.lastPlayedLevelId ?? {},
        editorEnabled: p.editorEnabled ?? false,
      };
    } catch {
      return { ...DEFAULT_PERSISTED };
    }
  }

  /**
   * Save state to backend
   */
  save(state: GameState): void {
    try {
      const payload: PersistedState = this.buildPayload(state);
      this.backend.setItem(this.storageKey, JSON.stringify(payload));
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
      bestTimes: state.bestTimes || {},
      showTutorial: state.showTutorial,
      generatedLevels: state.generatedLevels,
      currentModeId: state.currentModeId,
      seenTutorials: state.seenTutorials,
      animationsEnabled: state.animationsEnabled,
      theme: state.theme,
      lastPlayedLevelId: state.lastPlayedLevelId,
      editorEnabled: state.editor?.enabled ?? false,
    };
  }

  /**
   * Clear all persisted data
   */
  clear(): void {
    try {
      this.backend.removeItem(this.storageKey);
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

  /**
   * Get the underlying backend (for monitoring sync status, etc.)
   */
  getBackend(): PersistenceBackend {
    return this.backend;
  }

  // ─── Walkthrough Storage ────────────────────────────────────────────────

  /**
   * Check if a walkthrough has been seen for a given mode and level
   */
  isWalkthroughSeen(modeId: string, levelId: number): boolean {
    try {
      const key = `walkthrough-${modeId}-${levelId}`;
      return this.backend.getItem(key) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Mark a walkthrough as seen for a given mode and level
   */
  markWalkthroughSeen(modeId: string, levelId: number): void {
    try {
      const key = `walkthrough-${modeId}-${levelId}`;
      this.backend.setItem(key, 'true');
    } catch {
      // Silently fail
    }
  }

  /**
   * Reset a walkthrough (mark as not seen)
   */
  resetWalkthrough(modeId: string, levelId: number): void {
    try {
      const key = `walkthrough-${modeId}-${levelId}`;
      this.backend.removeItem(key);
    } catch {
      // Silently fail
    }
  }

  /**
   * Mark multiple walkthroughs as seen (for test mode)
   */
  markAllWalkthroughsSeen(modes: string[], levelIds: number[]): void {
    try {
      for (const mode of modes) {
        for (const levelId of levelIds) {
          const key = `walkthrough-${mode}-${levelId}`;
          this.backend.setItem(key, 'true');
        }
      }
    } catch {
      // Silently fail
    }
  }

  // ─── High Score Storage ─────────────────────────────────────────────────

  /**
   * Get high score for an unlimited level
   */
  getHighScore(modeId: string, levelId: number): number | null {
    try {
      const key = 'pressure_unlimited_highscores';
      const raw = this.backend.getItem(key);
      if (!raw) return null;

      const scores = JSON.parse(raw) as Record<string, number>;
      return scores[`${modeId}:${levelId}`] ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Set high score for an unlimited level (only if higher than existing)
   */
  setHighScore(modeId: string, levelId: number, score: number): void {
    try {
      const key = 'pressure_unlimited_highscores';
      const raw = this.backend.getItem(key);
      const scores = raw ? JSON.parse(raw) : ({} as Record<string, number>);

      const levelKey = `${modeId}:${levelId}`;
      if (!scores[levelKey] || score > scores[levelKey]) {
        scores[levelKey] = score;
        this.backend.setItem(key, JSON.stringify(scores));
      }
    } catch {
      // Silently fail
    }
  }

  // ─── State Editor Presets ───────────────────────────────────────────────

  /**
   * Get all state editor presets
   */
  getEditorPresets(): unknown[] {
    try {
      const raw = this.backend.getItem('state-editor-presets');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save state editor presets
   */
  setEditorPresets(presets: unknown[]): void {
    try {
      this.backend.setItem('state-editor-presets', JSON.stringify(presets));
    } catch {
      // Silently fail
    }
  }
}

/**
 * Create a persistence system instance with optional backend
 */
export function createPersistenceSystem(
  storageKey?: string,
  backend?: PersistenceBackend
): PersistenceSystem {
  return new PersistenceSystem(storageKey, backend);
}

// Re-export backends for easy access
export {
  LocalStorageBackend,
  InMemoryBackend,
  DatabaseBackend,
  MySQLBackend,
  SyncingBackend,
} from './backends';
export type { PersistenceBackend } from './backends';
