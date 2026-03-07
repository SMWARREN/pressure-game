/**
 * MenuScreen utility functions
 * Extracted to reduce cognitive complexity and nested ternaries
 */
import { ThemeColors } from '@/utils/themeColors';

interface LevelButtonStyleProps {
  isLastPlayed: boolean;
  done: boolean;
  worldColor: string;
  colors: ThemeColors;
}

/**
 * Compute level button border style
 */
export function getLevelButtonBorder(props: LevelButtonStyleProps): string {
  const { isLastPlayed, done, worldColor, colors } = props;
  if (isLastPlayed) return '1.5px solid #6366f1';
  if (done) return `1.5px solid ${worldColor}50`;
  return `1.5px solid ${colors.border.secondary}`;
}

/**
 * Compute level button background style
 */
export function getLevelButtonBackground(props: LevelButtonStyleProps): string {
  const { isLastPlayed, done, worldColor, colors } = props;
  if (isLastPlayed) {
    return 'linear-gradient(145deg, #6366f120 0%, #6366f108 100%)';
  }
  if (done) {
    return `linear-gradient(145deg, ${worldColor}18 0%, ${worldColor}0a 100%)`;
  }
  return `linear-gradient(145deg, ${colors.bg.secondary} 0%, ${colors.bg.secondary} 100%)`;
}

/**
 * Compute level button text color
 */
export function getLevelButtonColor(props: LevelButtonStyleProps): string {
  const { isLastPlayed, done, worldColor, colors } = props;
  if (isLastPlayed) return '#a5b4fc';
  if (done) return worldColor;
  return colors.text.tertiary;
}

/**
 * Compute level button box shadow
 */
export function getLevelButtonBoxShadow(props: LevelButtonStyleProps): string {
  const { isLastPlayed, done, worldColor } = props;
  if (isLastPlayed) return '0 0 16px #6366f130';
  if (done) return `0 0 16px ${worldColor}15`;
  return 'none';
}

interface LevelBadgeProps {
  readonly isUnlimited?: boolean;
  readonly unlimitedBest: number;
  readonly scoreBest?: number;
  readonly best?: number;
}

/**
 * Format level badge text (score display on level button)
 */
export function formatLevelBadge(props: LevelBadgeProps): string {
  const { isUnlimited, unlimitedBest, scoreBest, best } = props;

  if (isUnlimited && unlimitedBest > 0) {
    const formatted =
      unlimitedBest >= 1000 ? `${Math.floor(unlimitedBest / 1000)}k` : unlimitedBest;
    return `🏆 ${formatted}`;
  }

  if (scoreBest !== undefined) {
    const formatted = scoreBest >= 1000 ? `${Math.floor(scoreBest / 1000)}k` : scoreBest;
    return `★ ${formatted}`;
  }

  return `★ ${best ?? 0}`;
}

/**
 * Determine if level badge should be shown
 */
export function shouldShowLevelBadge(props: LevelBadgeProps): boolean {
  const { isUnlimited, unlimitedBest, scoreBest, best } = props;
  if (isUnlimited && unlimitedBest > 0) return true;
  if (scoreBest !== undefined) return true;
  // Show badge for regular completed levels with best moves
  if (best !== undefined) return true;
  return false;
}
