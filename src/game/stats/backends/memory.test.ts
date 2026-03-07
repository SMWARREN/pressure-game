import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStatsBackend } from './memory';
import type { GameStartEvent, GameEndEvent } from '../types';

describe('InMemoryStatsBackend', () => {
  let backend: InMemoryStatsBackend;

  beforeEach(() => {
    backend = new InMemoryStatsBackend();
  });

  describe('record', () => {
    it('should record game_start events', () => {
      const event: GameStartEvent = {
        ts: Date.now(),
        modeId: 'classic',
        levelId: 1,
        sessionId: 'session-1',
        type: 'game_start',
      };

      backend.record(event);
      const all = backend.getAll();
      expect(all).toHaveLength(1);
      expect(all[0]).toEqual(event);
    });

    it('should record game_end events', () => {
      const event: GameEndEvent = {
        ts: Date.now(),
        modeId: 'classic',
        levelId: 1,
        sessionId: 'session-1',
        type: 'game_end',
        outcome: 'won',
        moves: 5,
        elapsedSeconds: 30,
        score: 1000,
        lossReason: null,
        moveLog: [],
      };

      backend.record(event);
      const all = backend.getAll();
      expect(all).toHaveLength(1);
      expect(all[0]).toEqual(event);
    });

    it('should record multiple events in order', () => {
      const event1: GameStartEvent = {
        ts: Date.now(),
        modeId: 'classic',
        levelId: 1,
        sessionId: 'session-1',
        type: 'game_start',
      };

      const event2: GameEndEvent = {
        ts: Date.now() + 1000,
        modeId: 'classic',
        levelId: 1,
        sessionId: 'session-1',
        type: 'game_end',
        outcome: 'won',
        moves: 5,
        elapsedSeconds: 30,
        score: 1000,
        lossReason: null,
        moveLog: [],
      };

      backend.record(event1);
      backend.record(event2);
      const all = backend.getAll();
      expect(all).toHaveLength(2);
      expect(all[0].type).toBe('game_start');
      expect(all[1].type).toBe('game_end');
    });
  });

  describe('getAll', () => {
    it('should return empty array initially', () => {
      const all = backend.getAll();
      expect(all).toEqual([]);
    });

    it('should return all recorded events', () => {
      const event1: GameStartEvent = {
        ts: Date.now(),
        modeId: 'classic',
        levelId: 1,
        sessionId: 'session-1',
        type: 'game_start',
      };

      const event2: GameEndEvent = {
        ts: Date.now() + 1000,
        modeId: 'zen',
        levelId: 2,
        sessionId: 'session-2',
        type: 'game_end',
        outcome: 'lost',
        moves: 10,
        elapsedSeconds: 60,
        score: 500,
        lossReason: 'walls_crushed',
        moveLog: [],
      };

      backend.record(event1);
      backend.record(event2);

      const all = backend.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContainEqual(event1);
      expect(all).toContainEqual(event2);
    });

    it('should preserve insertion order', () => {
      const timestamps = [100, 200, 300, 400, 500];
      timestamps.forEach((ts) => {
        const event: GameStartEvent = {
          ts,
          modeId: 'classic',
          levelId: 1,
          sessionId: 'session-1',
          type: 'game_start',
        };
        backend.record(event);
      });

      const all = backend.getAll();
      expect(all).toHaveLength(5);
      all.forEach((event, index) => {
        expect(event.ts).toBe(timestamps[index]);
      });
    });
  });

  describe('clear', () => {
    it('should clear all events', () => {
      const event: GameStartEvent = {
        ts: Date.now(),
        modeId: 'classic',
        levelId: 1,
        sessionId: 'session-1',
        type: 'game_start',
      };

      backend.record(event);
      expect(backend.getAll()).toHaveLength(1);

      backend.clear();
      expect(backend.getAll()).toHaveLength(0);
    });

    it('should allow recording after clear', () => {
      const event1: GameStartEvent = {
        ts: Date.now(),
        modeId: 'classic',
        levelId: 1,
        sessionId: 'session-1',
        type: 'game_start',
      };

      const event2: GameStartEvent = {
        ts: Date.now() + 1000,
        modeId: 'blitz',
        levelId: 2,
        sessionId: 'session-2',
        type: 'game_start',
      };

      backend.record(event1);
      backend.clear();
      backend.record(event2);

      const all = backend.getAll();
      expect(all).toHaveLength(1);
      expect(all[0]).toEqual(event2);
    });
  });

  describe('Multiple backends', () => {
    it('should maintain separate state', () => {
      const backend1 = new InMemoryStatsBackend();
      const backend2 = new InMemoryStatsBackend();

      const event1: GameStartEvent = {
        ts: Date.now(),
        modeId: 'classic',
        levelId: 1,
        sessionId: 'session-1',
        type: 'game_start',
      };

      const event2: GameStartEvent = {
        ts: Date.now(),
        modeId: 'blitz',
        levelId: 2,
        sessionId: 'session-2',
        type: 'game_start',
      };

      backend1.record(event1);
      backend2.record(event2);

      expect(backend1.getAll()).toEqual([event1]);
      expect(backend2.getAll()).toEqual([event2]);
    });
  });
});
