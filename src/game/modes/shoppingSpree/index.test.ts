import { describe, it, expect } from 'vitest';
import { ShoppingSpreeMode } from './index';
import { SHOPPING_LEVELS, SHOPPING_ITEMS, ITEM_VALUES } from './levels';
import { useGameStore } from '@/game/store';

describe('Shopping Spree Mode', () => {
  describe('mode configuration', () => {
    it('should have valid mode config', () => {
      expect(ShoppingSpreeMode).toBeDefined();
      expect(ShoppingSpreeMode.id).toBe('shoppingSpree');
      expect(typeof ShoppingSpreeMode.name).toBe('string');
    });

    it('should have wall compression set to never', () => {
      expect(ShoppingSpreeMode.wallCompression).toBe('never');
    });

    it('should have color context', () => {
      const colors = ShoppingSpreeMode.getColorContext();
      expect(colors).toBeDefined();
      expect(colors.primary).toBeDefined();
    });

    it('should have custom tile renderer', () => {
      expect(ShoppingSpreeMode.tileRenderer).toBeDefined();
    });
  });

  describe('tutorial and walkthrough', () => {
    it('should have tutorial steps', () => {
      expect(Array.isArray(ShoppingSpreeMode.tutorialSteps)).toBe(true);
      expect(ShoppingSpreeMode.tutorialSteps!.length).toBeGreaterThan(0);
    });

    it('should have demo render function', () => {
      expect(typeof ShoppingSpreeMode.renderDemo).toBe('function');
    });

    it('should have walkthrough', () => {
      expect(ShoppingSpreeMode.walkthrough).toBeDefined();
    });
  });

  describe('level system', () => {
    it('should return levels array', () => {
      const levels = ShoppingSpreeMode.getLevels?.();
      expect(Array.isArray(levels)).toBe(true);
      expect(levels!.length).toBeGreaterThan(0);
    });

    it('each level should have core properties', () => {
      const levels = ShoppingSpreeMode.getLevels?.() ?? [];
      for (const level of levels) {
        expect(level.id).toBeDefined();
        expect(Array.isArray(level.tiles)).toBe(true);
        expect(level.tiles.length).toBeGreaterThan(0);
        expect(typeof level.targetScore).toBe('number');
      }
    });

    it('should have multiple worlds', () => {
      const worlds = new Set(SHOPPING_LEVELS.map((l) => l.world));
      expect(worlds.size).toBeGreaterThanOrEqual(3);
    });

    it('each level tile should have a shopping symbol', () => {
      const level = SHOPPING_LEVELS[0];
      for (const tile of level.tiles) {
        expect(tile.displayData?.symbol).toBeDefined();
      }
    });
  });

  describe('item values', () => {
    it('should define values for all shopping items', () => {
      for (const item of SHOPPING_ITEMS) {
        if (item !== '💎') {
          expect(ITEM_VALUES[item]).toBeGreaterThan(0);
        }
      }
    });

    it('diamond should be the highest value item', () => {
      const diamondValue = ITEM_VALUES['💎'];
      const otherValues = Object.entries(ITEM_VALUES)
        .filter(([k]) => k !== '💎')
        .map(([, v]) => v);
      expect(diamondValue).toBeGreaterThan(Math.max(...otherValues));
    });

    it('should have 5 shopping items', () => {
      expect(SHOPPING_ITEMS.length).toBe(5);
    });
  });

  describe('gameplay mechanics', () => {
    it('should have required handlers', () => {
      expect(typeof ShoppingSpreeMode.onTileTap).toBe('function');
      expect(typeof ShoppingSpreeMode.checkWin).toBe('function');
    });

    it('should have loss check', () => {
      expect(typeof ShoppingSpreeMode.checkLoss).toBe('function');
    });

    it('checkWin should return won=false when score is below target', () => {
      const level = SHOPPING_LEVELS[0];
      const modeState = { score: 0, targetScore: level.targetScore };
      const result = ShoppingSpreeMode.checkWin(level.tiles, [], 0, level.maxMoves!, modeState);
      expect(result.won).toBe(false);
    });

    it('checkWin should return won=true when score meets target', () => {
      const level = SHOPPING_LEVELS[0];
      const modeState = { score: level.targetScore!, targetScore: level.targetScore };
      const result = ShoppingSpreeMode.checkWin(level.tiles, [], 0, level.maxMoves!, modeState);
      expect(result.won).toBe(true);
    });

    it('checkWin should return won=true when moves exhausted', () => {
      const level = SHOPPING_LEVELS[0];
      const modeState = { score: 0, targetScore: level.targetScore };
      // moves >= maxMoves triggers a win (level ends regardless)
      const result = ShoppingSpreeMode.checkWin(level.tiles, [], level.maxMoves!, level.maxMoves!, modeState);
      expect(result.won).toBe(true);
    });

    it('checkLoss should return lost=false while moves remain', () => {
      const level = SHOPPING_LEVELS[0];
      const result = ShoppingSpreeMode.checkLoss!(level.tiles, 0, 0, level.maxMoves!);
      expect(result.lost).toBe(false);
    });

    it('onTileTap should return null for a single isolated tile', () => {
      const level = SHOPPING_LEVELS[0];
      const tile = level.tiles[0];
      // Single tile cannot form a group of 2+ — should be null
      const result = ShoppingSpreeMode.onTileTap(
        tile.x,
        tile.y,
        [{ ...tile, displayData: { symbol: '👗', activeSymbols: [...SHOPPING_ITEMS] } }],
        level.gridSize
      );
      expect(result).toBeNull();
    });

    it('onTileTap should process a valid group of matching tiles', () => {
      const level = SHOPPING_LEVELS[0];
      // Build a 2-tile group with matching symbols side by side
      const tileA = { ...level.tiles[0], x: 0, y: 0, displayData: { symbol: '👗', activeSymbols: [...SHOPPING_ITEMS] } };
      const tileB = { ...level.tiles[1], x: 1, y: 0, displayData: { symbol: '👗', activeSymbols: [...SHOPPING_ITEMS] } };
      const result = ShoppingSpreeMode.onTileTap(0, 0, [tileA, tileB], level.gridSize);
      // Valid group — should return a TapResult (not null)
      expect(result).not.toBeNull();
      expect(result?.valid).toBe(true);
      expect(typeof result?.scoreDelta).toBe('number');
      expect(result!.scoreDelta).toBeGreaterThan(0);
    });
  });

  describe('getWinTiles', () => {
    it('should return a Set of tile keys', () => {
      const level = SHOPPING_LEVELS[0];
      const result = ShoppingSpreeMode.getWinTiles!(level.tiles, []);
      expect(result instanceof Set).toBe(true);
      expect(result.size).toBeGreaterThan(0);
    });

    it('win tile keys should be in "x,y" format', () => {
      const level = SHOPPING_LEVELS[0];
      const result = ShoppingSpreeMode.getWinTiles!(level.tiles, []);
      for (const key of result) {
        expect(key).toMatch(/^\d+,\d+$/);
      }
    });
  });

  describe('mode state management', () => {
    it('getModeState is undefined or a function', () => {
      expect(
        ShoppingSpreeMode.getModeState === undefined ||
        typeof ShoppingSpreeMode.getModeState === 'function'
      ).toBe(true);
    });

    it('should have onTick for timers and events', () => {
      expect(typeof ShoppingSpreeMode.onTick).toBe('function');
    });
  });

  describe('integration', () => {
    it('should work with game store', () => {
      const state = useGameStore.getState();
      expect(state).toBeDefined();
    });

    it('level targetScores should increase with difficulty', () => {
      const world1 = SHOPPING_LEVELS.filter((l) => l.world === 1);
      const world3 = SHOPPING_LEVELS.filter((l) => l.world === 3);
      const avgWorld1 = world1.reduce((s, l) => s + l.targetScore!, 0) / world1.length;
      const avgWorld3 = world3.reduce((s, l) => s + l.targetScore!, 0) / world3.length;
      expect(avgWorld3).toBeGreaterThan(avgWorld1);
    });
  });
});
