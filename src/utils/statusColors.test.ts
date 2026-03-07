import { describe, it, expect } from 'vitest';
import {
  STATUS_COLORS,
  getStatusColor,
  getStatusBgColor,
  getStatusBorderColor,
  getStatusTextColor,
} from './statusColors';
import type { GameStatus } from '@/game/types';

describe('statusColors', () => {
  describe('STATUS_COLORS constant', () => {
    it('should have all required status keys', () => {
      const statuses: GameStatus[] = ['menu', 'idle', 'playing', 'won', 'lost', 'tutorial', 'paused'];
      statuses.forEach(status => {
        expect(STATUS_COLORS[status]).toBeDefined();
      });
    });

    it('should have all color variants for each status', () => {
      Object.values(STATUS_COLORS).forEach(colors => {
        expect(colors.bg).toBeDefined();
        expect(colors.border).toBeDefined();
        expect(colors.text).toBeDefined();
      });
    });

    it('should have valid hex color strings', () => {
      const hexRegex = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i;
      Object.values(STATUS_COLORS).forEach(colors => {
        expect(hexRegex.test(colors.bg)).toBe(true);
        expect(hexRegex.test(colors.border)).toBe(true);
        expect(hexRegex.test(colors.text)).toBe(true);
      });
    });
  });

  describe('getStatusColor', () => {
    it('should return background color for menu status', () => {
      expect(getStatusColor('menu', 'bg')).toBe(STATUS_COLORS.menu.bg);
    });

    it('should return border color for playing status', () => {
      expect(getStatusColor('playing', 'border')).toBe(STATUS_COLORS.playing.border);
    });

    it('should return text color for won status', () => {
      expect(getStatusColor('won', 'text')).toBe(STATUS_COLORS.won.text);
    });

    it('should return correct color for lost status', () => {
      expect(getStatusColor('lost', 'bg')).toBe(STATUS_COLORS.lost.bg);
      expect(getStatusColor('lost', 'border')).toBe(STATUS_COLORS.lost.border);
      expect(getStatusColor('lost', 'text')).toBe(STATUS_COLORS.lost.text);
    });

    it('should return correct color for tutorial status', () => {
      expect(getStatusColor('tutorial', 'bg')).toBe(STATUS_COLORS.tutorial.bg);
    });

    it('should return correct color for idle status', () => {
      expect(getStatusColor('idle', 'text')).toBe(STATUS_COLORS.idle.text);
    });

    it('should return correct color for paused status', () => {
      expect(getStatusColor('paused', 'bg')).toBe(STATUS_COLORS.paused.bg);
    });

    it('should fall back to idle color for undefined status', () => {
      const invalidStatus = 'unknown' as GameStatus;
      expect(getStatusColor(invalidStatus, 'bg')).toBe(STATUS_COLORS.idle.bg);
      expect(getStatusColor(invalidStatus, 'border')).toBe(STATUS_COLORS.idle.border);
      expect(getStatusColor(invalidStatus, 'text')).toBe(STATUS_COLORS.idle.text);
    });

    it('should return value for all variant combinations', () => {
      const statuses: GameStatus[] = ['menu', 'idle', 'playing', 'won', 'lost', 'tutorial', 'paused'];
      const variants = ['bg', 'border', 'text'] as const;

      statuses.forEach(status => {
        variants.forEach(variant => {
          const color = getStatusColor(status, variant);
          expect(color).toBeDefined();
          expect(typeof color).toBe('string');
          expect(color.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('getStatusBgColor', () => {
    it('should return background color for menu', () => {
      expect(getStatusBgColor('menu')).toBe(STATUS_COLORS.menu.bg);
    });

    it('should return background color for playing', () => {
      expect(getStatusBgColor('playing')).toBe(STATUS_COLORS.playing.bg);
    });

    it('should return background color for won', () => {
      expect(getStatusBgColor('won')).toBe(STATUS_COLORS.won.bg);
    });

    it('should return background color for lost', () => {
      expect(getStatusBgColor('lost')).toBe(STATUS_COLORS.lost.bg);
    });

    it('should return background color for tutorial', () => {
      expect(getStatusBgColor('tutorial')).toBe(STATUS_COLORS.tutorial.bg);
    });

    it('should return background color for idle', () => {
      expect(getStatusBgColor('idle')).toBe(STATUS_COLORS.idle.bg);
    });

    it('should return background color for paused', () => {
      expect(getStatusBgColor('paused')).toBe(STATUS_COLORS.paused.bg);
    });

    it('should fall back to idle background for invalid status', () => {
      const invalidStatus = 'invalid' as GameStatus;
      expect(getStatusBgColor(invalidStatus)).toBe(STATUS_COLORS.idle.bg);
    });
  });

  describe('getStatusBorderColor', () => {
    it('should return border color for menu', () => {
      expect(getStatusBorderColor('menu')).toBe(STATUS_COLORS.menu.border);
    });

    it('should return border color for playing', () => {
      expect(getStatusBorderColor('playing')).toBe(STATUS_COLORS.playing.border);
    });

    it('should return border color for won', () => {
      expect(getStatusBorderColor('won')).toBe(STATUS_COLORS.won.border);
    });

    it('should return border color for lost', () => {
      expect(getStatusBorderColor('lost')).toBe(STATUS_COLORS.lost.border);
    });

    it('should return border color for tutorial', () => {
      expect(getStatusBorderColor('tutorial')).toBe(STATUS_COLORS.tutorial.border);
    });

    it('should return border color for idle', () => {
      expect(getStatusBorderColor('idle')).toBe(STATUS_COLORS.idle.border);
    });

    it('should return border color for paused', () => {
      expect(getStatusBorderColor('paused')).toBe(STATUS_COLORS.paused.border);
    });

    it('should fall back to idle border for invalid status', () => {
      const invalidStatus = 'invalid' as GameStatus;
      expect(getStatusBorderColor(invalidStatus)).toBe(STATUS_COLORS.idle.border);
    });
  });

  describe('getStatusTextColor', () => {
    it('should return text color for menu', () => {
      expect(getStatusTextColor('menu')).toBe(STATUS_COLORS.menu.text);
    });

    it('should return text color for playing', () => {
      expect(getStatusTextColor('playing')).toBe(STATUS_COLORS.playing.text);
    });

    it('should return text color for won', () => {
      expect(getStatusTextColor('won')).toBe(STATUS_COLORS.won.text);
    });

    it('should return text color for lost', () => {
      expect(getStatusTextColor('lost')).toBe(STATUS_COLORS.lost.text);
    });

    it('should return text color for tutorial', () => {
      expect(getStatusTextColor('tutorial')).toBe(STATUS_COLORS.tutorial.text);
    });

    it('should return text color for idle', () => {
      expect(getStatusTextColor('idle')).toBe(STATUS_COLORS.idle.text);
    });

    it('should return text color for paused', () => {
      expect(getStatusTextColor('paused')).toBe(STATUS_COLORS.paused.text);
    });

    it('should fall back to idle text for invalid status', () => {
      const invalidStatus = 'invalid' as GameStatus;
      expect(getStatusTextColor(invalidStatus)).toBe(STATUS_COLORS.idle.text);
    });
  });

  describe('Color consistency', () => {
    it('should have consistent color structure across all statuses', () => {
      const allStatuses = Object.keys(STATUS_COLORS) as GameStatus[];
      const firstStatus = allStatuses[0];
      const expectedKeys = Object.keys(STATUS_COLORS[firstStatus]);

      allStatuses.forEach(status => {
        const keys = Object.keys(STATUS_COLORS[status]);
        expect(keys).toEqual(expectedKeys);
      });
    });

    it('should have different text colors for different statuses', () => {
      const textColors = ['menu', 'idle', 'playing', 'won', 'lost', 'tutorial', 'paused']
        .map(status => STATUS_COLORS[status as GameStatus].text);

      const uniqueTextColors = new Set(textColors);
      // Should have mostly different colors (at least some variation)
      expect(uniqueTextColors.size).toBeGreaterThan(1);
    });
  });
});
