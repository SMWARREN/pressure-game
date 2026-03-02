/**
 * Theme Color System - Light and Dark Modes
 * Centralized color definitions for consistent theming across the game
 */

export type Theme = 'light' | 'dark';

export interface ThemeColors {
  // Background colors
  bg: {
    primary: string;
    secondary: string;
    tertiary: string;
    board: string;
  };
  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  // Border colors
  border: {
    primary: string;
    secondary: string;
    light: string;
  };
  // Status colors
  status: {
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  // Game-specific
  game: {
    header: string;
    footer: string;
    overlay: string;
    hint: string;
  };
}

export const DARK_THEME: ThemeColors = {
  bg: {
    primary: '#06060f',
    secondary: '#0a0a1a',
    tertiary: '#0d0d1e',
    board: '#0a0a16',
  },
  text: {
    primary: '#ffffff',
    secondary: '#e0e7ff',
    tertiary: '#a0aec0',
  },
  border: {
    primary: '#12122a',
    secondary: '#1e1e3f',
    light: '#2d2d4f',
  },
  status: {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  game: {
    header: 'linear-gradient(180deg, #06060f 0%, #0a0a1a 100%)',
    footer: 'rgba(6,6,15,0.85)',
    overlay: 'rgba(10,10,20,0.95)',
    hint: '#60a5fa',
  },
};

export const LIGHT_THEME: ThemeColors = {
  bg: {
    primary: '#f8fafc',
    secondary: '#e2e8f0',
    tertiary: '#cbd5e1',
    board: '#f1f5f9',
  },
  text: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#475569',
  },
  border: {
    primary: '#cbd5e1',
    secondary: '#e2e8f0',
    light: '#f1f5f9',
  },
  status: {
    success: '#16a34a',
    error: '#dc2626',
    warning: '#d97706',
    info: '#2563eb',
  },
  game: {
    header: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
    footer: 'rgba(241,245,249,0.9)',
    overlay: 'rgba(241,245,249,0.95)',
    hint: '#3b82f6',
  },
};

export const getThemeColors = (theme: Theme): ThemeColors => {
  return theme === 'dark' ? DARK_THEME : LIGHT_THEME;
};
