/**
 * Mode Color Factory - Helper to create consistent color contexts for modes
 * Each mode completely owns its colors; views/engine are completely dumb about them.
 */

import { ModeColorContext } from './types';

/**
 * Create a color context for a mode.
 * This is the ONLY place where a mode should define its colors.
 */
export function createModeColors(overrides: Partial<ModeColorContext>): ModeColorContext {
  const defaults: ModeColorContext = {
    // UI Colors - mode primary color
    primary: '#a78bfa',
    secondary: '#c4b5fd',
    background: 'rgba(255,255,255,0.02)',
    border: 'rgba(99,102,241,0.3)',

    // Tile Colors
    tileDefault: '#1f2937',
    tileBorder: '#4b5563',
    tileActive: '#3b82f6',

    // Status Colors
    success: 'rgba(34,197,94,0.3)', // green
    danger: 'rgba(239,68,68,0.5)', // red
    warning: 'rgba(245,158,11,0.4)', // amber
    info: 'rgba(96,165,250,0.4)', // blue

    // Specific States
    nodeGlow: 'rgba(34,197,94,0.5)',
    pathActive: '#22c55e',
    wallColor: '#1f2937',
    crushed: 'rgba(239,68,68,0.3)',

    // Transparent variants
    transparent: {
      white01: 'rgba(255,255,255,0.01)',
      white02: 'rgba(255,255,255,0.02)',
      white04: 'rgba(255,255,255,0.04)',
      black30: 'rgba(0,0,0,0.3)',
      black50: 'rgba(0,0,0,0.5)',
      black60: 'rgba(0,0,0,0.6)',
    },
  };

  return { ...defaults, ...overrides };
}

/**
 * Predefined mode color palettes.
 * Each palette is self-contained - adding a new mode is just defining its palette here.
 */
export const modeColorPalettes = {
  classic: () =>
    createModeColors({
      primary: '#a78bfa', // purple
      secondary: '#c4b5fd',
    }),

  blitz: () =>
    createModeColors({
      primary: '#f97316', // orange
      secondary: '#fb923c',
      danger: 'rgba(239,68,68,0.5)',
      crushed: 'rgba(239,68,68,0.3)',
    }),

  zen: () =>
    createModeColors({
      primary: '#34d399', // emerald
      secondary: '#6ee7b7',
      success: 'rgba(34,197,94,0.5)',
    }),

  candy: () =>
    createModeColors({
      primary: '#ec4899', // pink
      secondary: '#f472b6',
      nodeGlow: 'rgba(236,72,153,0.6)',
      pathActive: '#ec4899',
    }),

  laserRelay: () =>
    createModeColors({
      primary: '#06b6d4', // cyan
      secondary: '#22d3ee',
      pathActive: '#06b6d4',
      nodeGlow: 'rgba(6,182,212,0.6)',
    }),

  gravityDrop: () =>
    createModeColors({
      primary: '#eab308', // yellow
      secondary: '#facc15',
      nodeGlow: 'rgba(234,179,8,0.6)',
    }),

  fuse: () =>
    createModeColors({
      primary: '#ef4444', // red
      secondary: '#f87171',
      danger: 'rgba(239,68,68,0.6)',
    }),

  shoppingSpree: () =>
    createModeColors({
      primary: '#8b5cf6', // violet
      secondary: '#a78bfa',
      nodeGlow: 'rgba(139,92,246,0.6)',
    }),

  gemBlast: () =>
    createModeColors({
      primary: '#06b6d4', // cyan (diamonds)
      secondary: '#22d3ee',
      nodeGlow: 'rgba(6,182,212,0.7)',
      success: 'rgba(6,182,212,0.4)',
    }),

  quantum_chain: () =>
    createModeColors({
      primary: '#8b5cf6', // violet
      secondary: '#a78bfa',
      pathActive: '#a78bfa',
      nodeGlow: 'rgba(139,92,246,0.6)',
    }),

  outbreak: () =>
    createModeColors({
      primary: '#dc2626', // red (viral)
      secondary: '#ef4444',
      danger: 'rgba(239,68,68,0.6)',
      nodeGlow: 'rgba(220,38,38,0.6)',
    }),

  memoryMatch: () =>
    createModeColors({
      primary: '#0ea5e9', // sky blue
      secondary: '#38bdf8',
      nodeGlow: 'rgba(14,165,233,0.6)',
      tileActive: '#0ea5e9',
    }),

  mirrorForge: () =>
    createModeColors({
      primary: '#f59e0b', // amber
      secondary: '#fbbf24',
      pathActive: '#f59e0b',
      nodeGlow: 'rgba(245,158,11,0.6)',
    }),

  voltage: () =>
    createModeColors({
      primary: '#f97316', // orange (electrical)
      secondary: '#fb923c',
      danger: 'rgba(249,115,22,0.5)',
      nodeGlow: 'rgba(249,115,22,0.6)',
    }),
};

export type ModeId = keyof typeof modeColorPalettes;

/**
 * Get color context for a mode ID.
 * If mode not found, returns classic palette.
 */
export function getModeColorPalette(modeId: string): ModeColorContext {
  const paletteFactory = modeColorPalettes[modeId as ModeId];
  return paletteFactory ? paletteFactory() : modeColorPalettes.classic();
}
