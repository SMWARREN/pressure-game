// PRESSURE - Persistence System
// Handles saving and loading game state through pluggable backends.
// Supports localStorage, database, or custom storage implementations.

import type { GameState } from '../types';
import type { PersistedState } from './types';
import type { PersistenceBackend } from './backends';
import { CookieBackend } from './backends';

/**
 * Single consolidated storage object containing all game data
 */
interface ConsolidatedStorage {
  save: PersistedState;
  highscores: Record<string, number>;
  editorPresets: unknown[];
}

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
 * Storage key - consolidated single object for all game data
 */
const STORAGE_KEY = 'pressure_storage_v1';

/**
 * Persistence system that handles saving and loading game state.
 * Uses an injected backend for flexible storage (localStorage, database, etc.)
 * All data is consolidated in a single storage object.
 */
export class PersistenceSystem {
  private readonly backend: PersistenceBackend;

  constructor(_storageKey?: string, backend?: PersistenceBackend) {
    // storageKey parameter ignored - always uses consolidated STORAGE_KEY
    this.backend = backend ?? new CookieBackend();
  }

  /**
   * Load persisted state from backend
   */
  load(): PersistedState {
    try {
      const raw = this.backend.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_PERSISTED };

      const storage = JSON.parse(raw) as ConsolidatedStorage;
      const p = storage.save || {};

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
   * Save state to backend (consolidated)
   */
  save(state: GameState): void {
    try {
      // Load existing storage to preserve highscores and presets
      const raw = this.backend.getItem(STORAGE_KEY);
      const storage: ConsolidatedStorage = raw ? JSON.parse(raw) : { save: {}, highscores: {}, editorPresets: [] };

      // Update only the save section
      storage.save = this.buildPayload(state);

      // Write consolidated object
      this.backend.setItem(STORAGE_KEY, JSON.stringify(storage));
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
      this.backend.removeItem(STORAGE_KEY);
    } catch {
      // Silently fail
    }
  }

  /**
   * Get the current storage key (always consolidated)
   */
  getStorageKey(): string {
    return STORAGE_KEY;
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
      const raw = this.backend.getItem(STORAGE_KEY);
      if (!raw) return null;

      const storage = JSON.parse(raw) as ConsolidatedStorage;
      return storage.highscores?.[`${modeId}:${levelId}`] ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Set high score for an unlimited level (only if higher than existing)
   */
  setHighScore(modeId: string, levelId: number, score: number): void {
    try {
      const raw = this.backend.getItem(STORAGE_KEY);
      const storage: ConsolidatedStorage = raw ? JSON.parse(raw) : { save: DEFAULT_PERSISTED, highscores: {}, editorPresets: [] };

      const levelKey = `${modeId}:${levelId}`;
      if (!storage.highscores[levelKey] || score > storage.highscores[levelKey]) {
        storage.highscores[levelKey] = score;
        this.backend.setItem(STORAGE_KEY, JSON.stringify(storage));
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
      const raw = this.backend.getItem(STORAGE_KEY);
      if (!raw) return [];

      const storage = JSON.parse(raw) as ConsolidatedStorage;
      return storage.editorPresets ?? [];
    } catch {
      return [];
    }
  }

  /**
   * Save state editor presets
   */
  setEditorPresets(presets: unknown[]): void {
    try {
      const raw = this.backend.getItem(STORAGE_KEY);
      const storage: ConsolidatedStorage = raw ? JSON.parse(raw) : { save: DEFAULT_PERSISTED, highscores: {}, editorPresets: [] };

      storage.editorPresets = presets;
      this.backend.setItem(STORAGE_KEY, JSON.stringify(storage));
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
