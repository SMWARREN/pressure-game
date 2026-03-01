/**
 * Consolidated Status Color Configuration
 *
 * Centralizes all status-based color values (background, border, text).
 * Replaces 3+ scattered switch/ternary implementations across components.
 */

import type { GameStatus } from '@/game/types';

export const STATUS_COLORS = {
  menu: { bg: '#f59e0b20', border: '#f59e0b40', text: '#f59e0b' },
  idle: { bg: '#f59e0b20', border: '#f59e0b40', text: '#f59e0b' },
  playing: { bg: '#10b98120', border: '#10b98140', text: '#10b981' },
  won: { bg: '#22c55e20', border: '#22c55e40', text: '#22c55e' },
  lost: { bg: '#ef444420', border: '#ef444440', text: '#ef4444' },
  tutorial: { bg: '#3b82f620', border: '#3b82f640', text: '#3b82f6' },
  paused: { bg: '#8b5cf620', border: '#8b5cf640', text: '#8b5cf6' },
} as const;

/**
 * Get a status color value by variant.
 * Falls back to 'idle' if status not found.
 */
export function getStatusColor(
  status: GameStatus,
  variant: 'bg' | 'border' | 'text'
): string {
  return STATUS_COLORS[status]?.[variant] ?? STATUS_COLORS.idle[variant];
}

/**
 * Convenience getter for background color.
 */
export function getStatusBgColor(status: GameStatus): string {
  return getStatusColor(status, 'bg');
}

/**
 * Convenience getter for border color.
 */
export function getStatusBorderColor(status: GameStatus): string {
  return getStatusColor(status, 'border');
}

/**
 * Convenience getter for text color.
 */
export function getStatusTextColor(status: GameStatus): string {
  return getStatusColor(status, 'text');
}
