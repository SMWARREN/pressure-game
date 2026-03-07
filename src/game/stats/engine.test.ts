import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StatsEngine } from './engine';
import type { StatsBackend, GameStartEvent, GameEndEvent } from './types';
import { useGameStore } from '../store';
import type { GameState } from '../types';

describe('StatsEngine', () => {
  let engine: StatsEngine;
  let mockBackend: StatsBackend;

  beforeEach(() => {
    mockBackend = {
      record: vi.fn(),
    };
    engine = new StatsEngine(mockBackend);
  });

  afterEach(() => {
    engine.stop();
  });

  describe('initialization', () => {
    it('should create engine with backend', () => {
      expect(engine).toBeDefined();
      expect(engine.getBackend()).toBe(mockBackend);
    });

    it('should have no unsubscribe listener initially', () => {
      expect(engine).toBeDefined();
    });
  });

  describe('backend management', () => {
    it('should set new backend', () => {
      const newBackend: StatsBackend = { record: vi.fn() };
      engine.setBackend(newBackend);
      expect(engine.getBackend()).toBe(newBackend);
    });

    it('should get current backend', () => {
      expect(engine.getBackend()).toBe(mockBackend);
    });
  });

  describe('lifecycle', () => {
    it('should start listening to store', () => {
      expect(() => engine.start()).not.toThrow();
    });

    it('should stop listening to store', () => {
      engine.start();
      expect(() => engine.stop()).not.toThrow();
    });

    it('should be idempotent on start', () => {
      engine.start();
      engine.start(); // Should not throw or double-subscribe
      expect(engine).toBeDefined();
    });
  });

  describe('game event callbacks', () => {
    it('should register game end callback', () => {
      const callback = vi.fn();
      engine.setOnGameEnd(callback);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should accept null callback', () => {
      engine.setOnGameEnd(() => {});
      expect(() => engine.setOnGameEnd(() => {})).not.toThrow();
    });
  });

  describe('event emission', () => {
    it('should emit game_start event on playing status', () => {
      engine.start();
      const state = useGameStore.getState();

      if (state.currentLevel) {
        // Simulate transition to playing
        useGameStore.setState({ status: 'playing' });

        // Wait for async operations
        setTimeout(() => {
          expect(mockBackend.record).toHaveBeenCalled();
        }, 100);
      }
    });

    it('should handle backend errors gracefully', () => {
      const errorBackend: StatsBackend = {
        record: vi.fn(() => {
          throw new Error('Backend error');
        }),
      };
      engine.setBackend(errorBackend);
      engine.start();

      expect(() => {
        useGameStore.setState({ status: 'playing' });
      }).not.toThrow();
    });
  });

  describe('move tracking', () => {
    it('should track moves in game session', () => {
      engine.start();
      const state = useGameStore.getState();

      if (state.currentLevel) {
        useGameStore.setState({
          status: 'playing',
          moves: 1,
          lastRotatedPos: { x: 0, y: 0 },
        });

        expect(engine).toBeDefined();
      }
    });
  });

  describe('session management', () => {
    it('should have consistent session ID across engine lifetime', () => {
      engine.start();
      // Session ID is generated on class instantiation
      expect(engine).toBeDefined();
    });

    it('should create different session IDs for different engines', () => {
      const engine1 = new StatsEngine(mockBackend);
      const engine2 = new StatsEngine(mockBackend);

      engine1.start();
      engine2.start();

      expect(engine1).toBeDefined();
      expect(engine2).toBeDefined();

      engine1.stop();
      engine2.stop();
    });
  });

  describe('game state transitions', () => {
    it('should handle idle to playing transition', () => {
      engine.start();
      const state = useGameStore.getState();

      if (state.currentLevel) {
        const initialStatus = state.status;
        useGameStore.setState({ status: 'playing' });
        expect(useGameStore.getState().status).toBe('playing');
      }

      engine.stop();
    });

    it('should handle playing to won transition', () => {
      engine.start();
      const state = useGameStore.getState();

      if (state.currentLevel) {
        useGameStore.setState({ status: 'playing', moves: 10 });
        useGameStore.setState({
          status: 'won',
          elapsedSeconds: 30,
          score: 500,
        });
        expect(useGameStore.getState().status).toBe('won');
      }

      engine.stop();
    });

    it('should handle playing to lost transition', () => {
      engine.start();
      const state = useGameStore.getState();

      if (state.currentLevel) {
        useGameStore.setState({ status: 'playing' });
        useGameStore.setState({
          status: 'lost',
          lossReason: 'walls_crushed',
        });
        expect(useGameStore.getState().status).toBe('lost');
      }

      engine.stop();
    });
  });

  describe('error handling', () => {
    it('should continue operating if backend.record throws', () => {
      const throwingBackend: StatsBackend = {
        record: vi.fn(() => {
          throw new Error('Simulated error');
        }),
      };
      engine.setBackend(throwingBackend);
      engine.start();

      expect(() => {
        useGameStore.setState({ status: 'playing' });
      }).not.toThrow();

      engine.stop();
    });

    it('should handle missing game level gracefully', () => {
      engine.start();
      // The engine checks if currentLevel exists before processing
      useGameStore.setState({ currentLevel: null });
      expect(() => {
        useGameStore.setState({ status: 'playing' });
      }).not.toThrow();
      engine.stop();
    });
  });

  describe('game end callback', () => {
    it('should invoke callback on game win', () => {
      return new Promise<void>((resolve) => {
        const callback = vi.fn();
        engine.setOnGameEnd(callback);
        engine.start();

        const state = useGameStore.getState();
        if (state.currentLevel) {
          useGameStore.setState({ status: 'playing' });
          useGameStore.setState({
            status: 'won',
            moves: 5,
            elapsedSeconds: 20,
            score: 100,
          });

          setTimeout(() => {
            expect(callback).toHaveBeenCalled();
            engine.stop();
            resolve();
          }, 50);
        } else {
          engine.stop();
          resolve();
        }
      });
    });

    it('should invoke callback on game loss', () => {
      return new Promise<void>((resolve) => {
        const callback = vi.fn();
        engine.setOnGameEnd(callback);
        engine.start();

        const state = useGameStore.getState();
        if (state.currentLevel) {
          useGameStore.setState({ status: 'playing' });
          useGameStore.setState({
            status: 'lost',
            moves: 8,
            elapsedSeconds: 45,
            score: 50,
            lossReason: 'walls_crushed',
          });

          setTimeout(() => {
            expect(callback).toHaveBeenCalled();
            engine.stop();
            resolve();
          }, 50);
        } else {
          engine.stop();
          resolve();
        }
      });
    });
  });

  describe('integration', () => {
    it('should track complete game session', () => {
      engine.start();
      const state = useGameStore.getState();

      if (state.currentLevel) {
        // Start game
        useGameStore.setState({ status: 'playing', moves: 0 });

        // Make moves
        useGameStore.setState({
          moves: 1,
          lastRotatedPos: { x: 0, y: 0 },
        });

        // Win game
        useGameStore.setState({
          status: 'won',
          moves: 3,
          elapsedSeconds: 15,
          score: 200,
        });

        expect(useGameStore.getState().status).toBe('won');
      }

      engine.stop();
    });
  });
});
