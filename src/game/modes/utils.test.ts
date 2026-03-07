import { describe, it, expect } from 'vitest';
import {
  getMinGroupSizeForWorld,
  deltaToDirection,
  directionToOffset,
  createTileMap,
  rotateConnections,
  checkConnected,
  getConnectedTiles,
  getConnectedTilesDFS,
  rotateTileTap,
} from './utils';
import type { Direction } from '../types';

const createPath = (x: number, y: number, connections: Direction[] = []) => ({
  id: `t-${x}-${y}`,
  type: 'path' as const,
  x,
  y,
  connections,
  canRotate: true,
  isGoalNode: false,
});

const createNode = (x: number, y: number, connections: Direction[] = [], isGoal = false) => ({
  id: `n-${x}-${y}`,
  type: 'node' as const,
  x,
  y,
  connections,
  canRotate: false,
  isGoalNode: isGoal,
});

const createWall = (x: number, y: number) => ({
  id: `w-${x}-${y}`,
  type: 'wall' as const,
  x,
  y,
  connections: [] as Direction[],
  canRotate: false,
  isGoalNode: false,
});

describe('Mode Utils', () => {
  describe('getMinGroupSizeForWorld', () => {
    it('should return 3 for worlds 1-2', () => {
      expect(getMinGroupSizeForWorld(1)).toBe(3);
      expect(getMinGroupSizeForWorld(2)).toBe(3);
    });

    it('should return 4 for worlds 3+', () => {
      expect(getMinGroupSizeForWorld(3)).toBe(4);
      expect(getMinGroupSizeForWorld(5)).toBe(4);
      expect(getMinGroupSizeForWorld(10)).toBe(4);
    });
  });

  describe('deltaToDirection', () => {
    it('should convert cardinal deltas', () => {
      expect(deltaToDirection(1, 0)).toBe('right');
      expect(deltaToDirection(-1, 0)).toBe('left');
      expect(deltaToDirection(0, 1)).toBe('down');
      expect(deltaToDirection(0, -1)).toBe('up');
      expect(deltaToDirection(0, 0)).toBe('up');
    });

    it('should handle non-unit deltas (only exact ±1 maps)', () => {
      expect(deltaToDirection(5, 0)).toBe('up'); // Falls through
      expect(deltaToDirection(0, 5)).toBe('up'); // Falls through
    });
  });

  describe('directionToOffset', () => {
    it('should convert directions to offsets', () => {
      expect(directionToOffset('right')).toEqual([1, 0]);
      expect(directionToOffset('left')).toEqual([-1, 0]);
      expect(directionToOffset('down')).toEqual([0, 1]);
      expect(directionToOffset('up')).toEqual([0, -1]);
    });
  });

  describe('createTileMap', () => {
    it('should create position-keyed map', () => {
      const tiles = [createNode(0, 0), createPath(1, 0)];
      const map = createTileMap(tiles);
      expect(map.get('0,0')).toBe(tiles[0]);
      expect(map.get('1,0')).toBe(tiles[1]);
    });

    it('should handle empty array', () => {
      const map = createTileMap([]);
      expect(map.size).toBe(0);
    });
  });

  describe('rotateConnections', () => {
    it('should rotate clockwise', () => {
      expect(rotateConnections(['up'], 1)).toEqual(['right']);
      expect(rotateConnections(['right'], 1)).toEqual(['down']);
      expect(rotateConnections(['down'], 1)).toEqual(['left']);
      expect(rotateConnections(['left'], 1)).toEqual(['up']);
    });

    it('should handle full rotation', () => {
      expect(rotateConnections(['up'], 4)).toEqual(['up']);
    });

    it('should rotate L-shape', () => {
      expect(rotateConnections(['up', 'right'], 1)).toEqual(['right', 'down']);
    });

    it('should rotate straight pipe', () => {
      expect(rotateConnections(['up', 'down'], 1)).toEqual(['right', 'left']);
    });
  });

  describe('checkConnected', () => {
    it('should return true for < 2 goals', () => {
      expect(checkConnected([], [])).toBe(true);
      expect(checkConnected([], [{ x: 0, y: 0 }])).toBe(true);
    });

    it('should detect connected path', () => {
      const tiles = [
        createNode(0, 0, ['right'], true),
        createPath(1, 0, ['left', 'right']),
        createNode(2, 0, ['left'], true),
      ];
      const goals = [{ x: 0, y: 0 }, { x: 2, y: 0 }];
      expect(checkConnected(tiles, goals)).toBe(true);
    });

    it('should detect disconnected goals', () => {
      const tiles = [
        createNode(0, 0, ['right'], true),
        createPath(1, 0, ['right']), // Wrong connection
        createNode(2, 0, ['left'], true),
      ];
      const goals = [{ x: 0, y: 0 }, { x: 2, y: 0 }];
      expect(checkConnected(tiles, goals)).toBe(false);
    });

    it('should ignore walls', () => {
      const tiles = [
        createNode(0, 0, ['right'], true),
        createWall(1, 0),
        createNode(2, 0, ['left'], true),
      ];
      const goals = [{ x: 0, y: 0 }, { x: 2, y: 0 }];
      expect(checkConnected(tiles, goals)).toBe(false);
    });

    it('should handle complex paths', () => {
      const tiles = [
        createNode(0, 0, ['down'], true),
        createPath(0, 1, ['up', 'right']),
        createNode(1, 1, ['left'], true),
      ];
      const goals = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
      expect(checkConnected(tiles, goals)).toBe(true);
    });
  });

  describe('getConnectedTiles', () => {
    it('should return empty for < 2 goals', () => {
      const result = getConnectedTiles([], [{ x: 0, y: 0 }]);
      expect(result.size).toBe(0);
    });

    it('should return connected path', () => {
      const tiles = [
        createNode(0, 0, ['right'], true),
        createPath(1, 0, ['left', 'right']),
        createNode(2, 0, ['left'], true),
      ];
      const result = getConnectedTiles(tiles, [{ x: 0, y: 0 }, { x: 2, y: 0 }]);
      expect(result.has('0,0')).toBe(true);
      expect(result.has('1,0')).toBe(true);
      expect(result.has('2,0')).toBe(true);
    });

    it('should exclude disconnected tiles', () => {
      const tiles = [
        createNode(0, 0, ['right'], true),
        createPath(1, 0, ['left']),
        createNode(3, 0, [], true),
      ];
      const result = getConnectedTiles(tiles, [{ x: 0, y: 0 }, { x: 3, y: 0 }]);
      expect(result.has('3,0')).toBe(false);
    });
  });

  describe('getConnectedTilesDFS', () => {
    it('should match BFS on simple path', () => {
      const tiles = [
        createNode(0, 0, ['right'], true),
        createPath(1, 0, ['left', 'right']),
        createNode(2, 0, ['left'], true),
      ];
      const goals = [{ x: 0, y: 0 }, { x: 2, y: 0 }];
      const bfs = getConnectedTiles(tiles, goals);
      const dfs = getConnectedTilesDFS(tiles, goals);
      expect(bfs).toEqual(dfs);
    });

    it('should handle branching paths', () => {
      const tiles = [
        createNode(0, 0, ['right', 'down'], true),
        createPath(1, 0, ['left', 'down']),
        createPath(0, 1, ['up', 'right']),
        createNode(1, 1, ['up', 'left'], true),
      ];
      const goals = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
      const result = getConnectedTilesDFS(tiles, goals);
      expect(result.size).toBe(4);
    });
  });

  describe('rotateTileTap', () => {
    it('should rotate tile at position', () => {
      const tiles = [createPath(1, 1, ['up', 'down'])];
      const result = rotateTileTap(1, 1, tiles);
      expect(result?.[0].connections).toEqual(['right', 'left']);
      expect(result?.[0].justRotated).toBe(true);
    });

    it('should return null if not rotatable', () => {
      const tiles = [createNode(0, 0)];
      expect(rotateTileTap(0, 0, tiles)).toBeNull();
    });

    it('should return null if tile not found', () => {
      const tiles = [createPath(0, 0)];
      expect(rotateTileTap(5, 5, tiles)).toBeNull();
    });

    it('should clear justRotated on other tiles', () => {
      const tiles = [
        { ...createPath(0, 0), justRotated: true },
        createPath(1, 0),
      ];
      const result = rotateTileTap(1, 0, tiles);
      expect(result?.[0].justRotated).toBe(false);
      expect(result?.[1].justRotated).toBe(true);
    });

    it('should preserve other properties', () => {
      const tiles = [createPath(0, 0), createPath(1, 0)];
      const result = rotateTileTap(0, 0, tiles);
      expect(result?.[1]).toEqual(tiles[1]);
    });
  });
});
