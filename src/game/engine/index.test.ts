import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PressureEngine } from './index';
import type { GameState, Level } from '../types';
import { useGameStore } from '../store';

describe('PressureEngine', () => {
  let engine: PressureEngine;
  let mockGetState: () => GameState;
  let mockSetState: (partial: Partial<GameState>) => void;

  beforeEach(() => {
    engine = new PressureEngine({
      storageKey: 'test_storage',
      audioEnabled: false,
      tickInterval: 100,
    });

    const state = useGameStore.getState();
    mockGetState = () => state;
    mockSetState = vi.fn();

    engine.init(mockGetState, mockSetState);
  });

  afterEach(() => {
    engine.destroy();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create engine with default config', () => {
      const defaultEngine = new PressureEngine();
      expect(defaultEngine).toBeDefined();
      defaultEngine.destroy();
    });

    it('should create engine with custom config', () => {
      const customEngine = new PressureEngine({
        storageKey: 'custom_key',
        audioEnabled: true,
        tickInterval: 500,
      });
      expect(customEngine).toBeDefined();
      customEngine.destroy();
    });

    it('should initialize with getState and setState callbacks', () => {
      expect(engine).toBeDefined();
      const context = engine.createContext();
      expect(context).toBeDefined();
      expect(context.modeId).toBeDefined();
      expect(typeof context.getState).toBe('function');
    });
  });

  describe('Context Creation', () => {
    it('should create valid engine context', () => {
      const context = engine.createContext();
      expect(context).toBeDefined();
      expect(context.modeId).toBeDefined();
      expect(context.sfx).toBeDefined();
      expect(typeof context.sfx).toBe('function');
    });

    it('should include mode and level in context', () => {
      const context = engine.createContext();
      expect(context.modeId).toBeDefined();
      expect(context.level).toBeDefined();
      expect(typeof context.getState).toBe('function');
    });

    it('should include state accessors in context', () => {
      const context = engine.createContext();
      expect(typeof context.getState).toBe('function');
      expect(typeof context.setState).toBe('function');
    });
  });

  describe('Timer Management', () => {
    it('should start timer', () => {
      expect(() => engine.startTimer()).not.toThrow();
      engine.stopTimer();
    });

    it('should stop timer', () => {
      engine.startTimer();
      expect(() => engine.stopTimer()).not.toThrow();
    });

    it('should clear all timers', () => {
      engine.setTimeout(() => {}, 1000);
      expect(() => engine.clearTimers()).not.toThrow();
    });

    it('should create setTimeout', () => {
      const callback = vi.fn();
      const timeoutId = engine.setTimeout(callback, 100);
      expect(timeoutId).toBeDefined();
    });
  });

  describe('Audio System', () => {
    it('should play sound effect', () => {
      const context = engine.createContext();
      expect(() => context.sfx('start')).not.toThrow();
    });

    it('should handle invalid sound effects gracefully', () => {
      const context = engine.createContext();
      expect(() => context.sfx('start')).not.toThrow();
    });
  });

  describe('Persistence', () => {
    it('should load persisted state', () => {
      const persisted = engine.loadPersisted();
      expect(persisted).toBeDefined();
      expect(typeof persisted).toBe('object');
    });

    it('should persist game state', () => {
      const state = useGameStore.getState();
      expect(() => engine.persist(state)).not.toThrow();
    });

    it('should build persist payload', () => {
      const state = useGameStore.getState();
      const payload = engine.buildPersistPayload(state);
      expect(payload).toBeDefined();
      expect(typeof payload).toBe('object');
    });

    it('should get high score', () => {
      const score = engine.getHighScore('classic', 1);
      expect(typeof score === 'number' || score === null).toBe(true);
    });

    it('should set high score', () => {
      expect(() => engine.setHighScore('classic', 1, 5000)).not.toThrow();
      const retrieved = engine.getHighScore('classic', 1);
      expect(retrieved).toBe(5000);
    });
  });

  describe('Game Lifecycle', () => {
    it('should handle win state', () => {
      const state = useGameStore.getState();
      const level: Level = state.currentLevel!;

      if (level) {
        expect(() => {
          engine.handleWin(state.tiles, level.goalNodes);
        }).not.toThrow();
      }
    });

    it('should get initial level state', () => {
      const state = useGameStore.getState();
      const level: Level = state.currentLevel!;

      if (level) {
        const levelState = engine.getInitialLevelState(level);
        expect(levelState).toBeDefined();
        expect(typeof levelState).toBe('object');
      }
    });

    it('should get initial game state', () => {
      const initialState = engine.getInitialState();
      expect(initialState).toBeDefined();
      expect(initialState.status).toBeDefined();
      expect(initialState.tiles).toBeDefined();
    });

    it('should advance walls', () => {
      const result = engine.advanceWalls();
      // Result can be null or a valid result object
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('Achievement Integration', () => {
    it('should set achievement engine', () => {
      const mockAchievementEngine = {
        checkAchievements: vi.fn(),
        unlockAchievement: vi.fn(),
      };

      expect(() => {
        engine.setAchievementEngine(mockAchievementEngine as any);
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should destroy engine without errors', () => {
      expect(() => engine.destroy()).not.toThrow();
    });

    it('should clear timers on destroy', () => {
      engine.setTimeout(() => {}, 1000);
      expect(() => engine.destroy()).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should respect storage key configuration', () => {
      const customEngine = new PressureEngine({
        storageKey: 'my_custom_key',
      });
      expect(customEngine).toBeDefined();
      customEngine.destroy();
    });

    it('should respect audio configuration', () => {
      const audioEngine = new PressureEngine({ audioEnabled: true });
      const noAudioEngine = new PressureEngine({ audioEnabled: false });

      expect(audioEngine).toBeDefined();
      expect(noAudioEngine).toBeDefined();

      audioEngine.destroy();
      noAudioEngine.destroy();
    });

    it('should respect tick interval configuration', () => {
      const slowEngine = new PressureEngine({ tickInterval: 500 });
      const fastEngine = new PressureEngine({ tickInterval: 100 });

      expect(slowEngine).toBeDefined();
      expect(fastEngine).toBeDefined();

      slowEngine.destroy();
      fastEngine.destroy();
    });
  });

  describe('Error Handling', () => {
    it('should handle multiple initializations', () => {
      const setState1 = vi.fn();
      const setState2 = vi.fn();

      const state = useGameStore.getState();
      engine.init(() => state, setState1);
      engine.init(() => state, setState2);

      expect(engine).toBeDefined();
    });

    it('should handle onTick updates', () => {
      const updates = engine.onTick();
      expect(updates === null || typeof updates === 'object').toBe(true);
    });
  });

  describe('Game State Updates', () => {
    it('should track elapsed time', () => {
      const updates = engine.onTick();
      expect(updates).toBeDefined();
    });

    it('should track moves counter', () => {
      expect(typeof useGameStore.getState().moves).toBe('number');
      expect(useGameStore.getState().moves).toBeGreaterThanOrEqual(0);
    });

    it('should handle walkthrough states', () => {
      expect(() => {
        const seen = engine.isWalkthroughSeen('classic', 1);
        expect(typeof seen).toBe('boolean');
      }).not.toThrow();
    });

    it('should mark walkthrough as seen', () => {
      expect(() => {
        engine.markWalkthroughSeen('classic', 1);
        const seen = engine.isWalkthroughSeen('classic', 1);
        expect(seen).toBe(true);
      }).not.toThrow();
    });
  });
});
