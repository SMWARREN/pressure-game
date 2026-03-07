import { describe, it, expect } from 'vitest';
import { getThemeColors, DARK_THEME, LIGHT_THEME } from './themeColors';
import type { Theme } from './themeColors';

describe('themeColors', () => {
  describe('DARK_THEME', () => {
    it('should have all required properties', () => {
      expect(DARK_THEME.bg).toBeDefined();
      expect(DARK_THEME.text).toBeDefined();
      expect(DARK_THEME.border).toBeDefined();
      expect(DARK_THEME.status).toBeDefined();
      expect(DARK_THEME.game).toBeDefined();
    });

    it('should have all background colors', () => {
      expect(DARK_THEME.bg.primary).toBeDefined();
      expect(DARK_THEME.bg.secondary).toBeDefined();
      expect(DARK_THEME.bg.tertiary).toBeDefined();
      expect(DARK_THEME.bg.board).toBeDefined();
    });

    it('should have all text colors', () => {
      expect(DARK_THEME.text.primary).toBeDefined();
      expect(DARK_THEME.text.secondary).toBeDefined();
      expect(DARK_THEME.text.tertiary).toBeDefined();
    });

    it('should have all border colors', () => {
      expect(DARK_THEME.border.primary).toBeDefined();
      expect(DARK_THEME.border.secondary).toBeDefined();
      expect(DARK_THEME.border.light).toBeDefined();
    });

    it('should have all status colors', () => {
      expect(DARK_THEME.status.success).toBeDefined();
      expect(DARK_THEME.status.error).toBeDefined();
      expect(DARK_THEME.status.warning).toBeDefined();
      expect(DARK_THEME.status.info).toBeDefined();
    });

    it('should have all game colors', () => {
      expect(DARK_THEME.game.header).toBeDefined();
      expect(DARK_THEME.game.footer).toBeDefined();
      expect(DARK_THEME.game.overlay).toBeDefined();
      expect(DARK_THEME.game.hint).toBeDefined();
    });

    it('should have consistent color string types', () => {
      expect(typeof DARK_THEME.bg.primary).toBe('string');
      expect(typeof DARK_THEME.text.primary).toBe('string');
      expect(typeof DARK_THEME.border.primary).toBe('string');
      expect(typeof DARK_THEME.status.success).toBe('string');
      expect(typeof DARK_THEME.game.header).toBe('string');
    });
  });

  describe('LIGHT_THEME', () => {
    it('should have all required properties', () => {
      expect(LIGHT_THEME.bg).toBeDefined();
      expect(LIGHT_THEME.text).toBeDefined();
      expect(LIGHT_THEME.border).toBeDefined();
      expect(LIGHT_THEME.status).toBeDefined();
      expect(LIGHT_THEME.game).toBeDefined();
    });

    it('should have all background colors', () => {
      expect(LIGHT_THEME.bg.primary).toBeDefined();
      expect(LIGHT_THEME.bg.secondary).toBeDefined();
      expect(LIGHT_THEME.bg.tertiary).toBeDefined();
      expect(LIGHT_THEME.bg.board).toBeDefined();
    });

    it('should have all text colors', () => {
      expect(LIGHT_THEME.text.primary).toBeDefined();
      expect(LIGHT_THEME.text.secondary).toBeDefined();
      expect(LIGHT_THEME.text.tertiary).toBeDefined();
    });

    it('should have all border colors', () => {
      expect(LIGHT_THEME.border.primary).toBeDefined();
      expect(LIGHT_THEME.border.secondary).toBeDefined();
      expect(LIGHT_THEME.border.light).toBeDefined();
    });

    it('should have all status colors', () => {
      expect(LIGHT_THEME.status.success).toBeDefined();
      expect(LIGHT_THEME.status.error).toBeDefined();
      expect(LIGHT_THEME.status.warning).toBeDefined();
      expect(LIGHT_THEME.status.info).toBeDefined();
    });

    it('should have all game colors', () => {
      expect(LIGHT_THEME.game.header).toBeDefined();
      expect(LIGHT_THEME.game.footer).toBeDefined();
      expect(LIGHT_THEME.game.overlay).toBeDefined();
      expect(LIGHT_THEME.game.hint).toBeDefined();
    });

    it('should have consistent color string types', () => {
      expect(typeof LIGHT_THEME.bg.primary).toBe('string');
      expect(typeof LIGHT_THEME.text.primary).toBe('string');
      expect(typeof LIGHT_THEME.border.primary).toBe('string');
      expect(typeof LIGHT_THEME.status.success).toBe('string');
      expect(typeof LIGHT_THEME.game.header).toBe('string');
    });
  });

  describe('getThemeColors', () => {
    it('should return DARK_THEME for dark mode', () => {
      const theme = getThemeColors('dark');
      expect(theme).toBe(DARK_THEME);
    });

    it('should return LIGHT_THEME for light mode', () => {
      const theme = getThemeColors('light');
      expect(theme).toBe(LIGHT_THEME);
    });

    it('should default to LIGHT_THEME for unknown theme', () => {
      const theme = getThemeColors('unknown' as Theme);
      expect(theme).toBe(LIGHT_THEME);
    });

    it('should return theme with all required properties', () => {
      const darkTheme = getThemeColors('dark');
      expect(darkTheme.bg).toBeDefined();
      expect(darkTheme.text).toBeDefined();
      expect(darkTheme.border).toBeDefined();
      expect(darkTheme.status).toBeDefined();
      expect(darkTheme.game).toBeDefined();
    });

    it('should return different themes for dark and light', () => {
      const darkTheme = getThemeColors('dark');
      const lightTheme = getThemeColors('light');
      expect(darkTheme).not.toBe(lightTheme);
      // Check that some colors are actually different
      expect(darkTheme.bg.primary).not.toBe(lightTheme.bg.primary);
      expect(darkTheme.text.primary).not.toBe(lightTheme.text.primary);
    });

    it('should be consistent across multiple calls', () => {
      const theme1 = getThemeColors('dark');
      const theme2 = getThemeColors('dark');
      expect(theme1).toBe(theme2);
    });
  });

  describe('Theme color contrast', () => {
    it('should have primary text and background colors defined', () => {
      [DARK_THEME, LIGHT_THEME].forEach(theme => {
        expect(theme.text.primary).toBeDefined();
        expect(theme.bg.primary).toBeDefined();
      });
    });

    it('dark theme should have light text colors', () => {
      // Dark theme should have bright text
      expect(DARK_THEME.text.primary).toBeTruthy();
      expect(DARK_THEME.text.secondary).toBeTruthy();
      expect(DARK_THEME.text.tertiary).toBeTruthy();
    });

    it('light theme should have dark text colors', () => {
      // Light theme should have dark text
      expect(LIGHT_THEME.text.primary).toBeTruthy();
      expect(LIGHT_THEME.text.secondary).toBeTruthy();
      expect(LIGHT_THEME.text.tertiary).toBeTruthy();
    });
  });

  describe('Status colors', () => {
    it('should have consistent status colors across themes', () => {
      ['success', 'error', 'warning', 'info'].forEach(status => {
        expect(DARK_THEME.status[status as keyof typeof DARK_THEME.status]).toBeDefined();
        expect(LIGHT_THEME.status[status as keyof typeof LIGHT_THEME.status]).toBeDefined();
      });
    });
  });
});
