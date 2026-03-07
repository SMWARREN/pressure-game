/**
 * Mode-Specific Color Configurations
 *
 * Consolidates hardcoded mode colors and styling logic.
 * Reduces nested ternaries in mode files.
 */

import { RGBA_COLORS } from './constants';

// Mode accent colors
export const MODE_COLORS = {
  candy: '#ec4899', // pink
  shopping: '#f97316', // orange
  gemBlast: '#6366f1', // indigo
  gravityDrop: '#06b6d4', // cyan
  laserRelay: '#8b5cf6', // violet
  outbreak: '#06b6d4', // cyan
  fuse: '#eab308', // yellow
  voltage: '#22c55e', // green
  mirrorForge: '#3b82f6', // blue
  memoryMatch: '#ec4899', // pink
  quantumChain: '#f97316', // orange
  shoppingSpree: '#f97316', // orange
} as const;

/**
 * Get mode color by ID
 */
export function getModeColor(modeId: string): string {
  return MODE_COLORS[modeId as keyof typeof MODE_COLORS] || '#6366f1';
}

/**
 * Get mode-specific tile glow color for hints/danger states
 */
export function getModeGlowColor(modeId: string, state: 'hint' | 'danger' | 'normal'): string {
  const base = getModeColor(modeId);
  if (state === 'danger') return RGBA_COLORS.RED_ERROR;
  if (state === 'hint') return `${base}80`;
  return `${base}40`;
}
