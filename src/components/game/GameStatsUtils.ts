/**
 * GameStats utility functions
 * Extracted to reduce cognitive complexity and nested ternaries
 */

import { RGBA_COLORS } from '@/utils/constants';

/**
 * Get compression bar color based on percentage
 */
export function getCompressionColor(percent: number): string {
  if (percent > 66) return '#ef4444';
  if (percent > 33) return '#f59e0b';
  return '#22c55e';
}

/**
 * Get compression bar glow color based on percentage
 */
export function getCompressionGlow(percent: number): string {
  if (percent > 66) return RGBA_COLORS.RED_ERROR;
  if (percent > 33) return RGBA_COLORS.AMBER_WARNING;
  return RGBA_COLORS.GREEN_SUCCESS;
}

/**
 * Get compression status label based on percentage and active state
 */
export function getCompressionLabel(percent: number, active: boolean): string {
  if (!active) return 'WAITING';
  if (percent > 66) return '⚠ CRITICAL';
  if (percent > 33) return 'WARNING';
  return 'ACTIVE';
}

/**
 * Get score display color based on progress percentage
 */
export function getScoreColor(percent: number): string {
  if (percent >= 100) return '#22c55e';
  if (percent > 40) return '#f472b6';
  return '#f59e0b';
}

/**
 * Get timeleft display color based on urgency
 */
export function getTimeleftColor(timeLeft: number): string {
  if (timeLeft <= 10) return '#ef4444';
  if (timeLeft <= 30) return '#f59e0b';
  return '#60a5fa';
}

/**
 * Get timeleft bar glow based on urgency
 */
export function getTimeleftGlow(timeLeft: number, pct: number): string {
  if (pct <= 10) return 'none';
  if (timeLeft <= 10) return RGBA_COLORS.RED_ERROR;
  return RGBA_COLORS.BLUE_INFO;
}
