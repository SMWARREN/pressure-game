/**
 * Tile animation and transform utilities
 * Pure functions for computing animation strings and transforms
 */

/**
 * Get tile transform based on animation and press state
 */
function getTileTransform(
  animationsEnabled: boolean | undefined,
  pressed: boolean,
  justRotated: boolean | undefined
): string {
  if (!animationsEnabled) return 'scale(1)';
  if (pressed) return 'scale(0.84)';
  if (justRotated) return 'scale(1.08)';
  return 'scale(1)';
}

/**
 * Get tile transition string
 */
function getTileTransition(animationsEnabled: boolean | undefined, pressed: boolean): string {
  if (!animationsEnabled) return 'none';
  if (pressed) return 'transform 0.08s ease';
  return 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)';
}

/**
 * Get outbreak-specific animation
 */
function getOutbreakAnimation(
  isOutbreak: boolean,
  animationsEnabled: boolean,
  isNewTile: boolean,
  obFrontier: boolean
): string | undefined {
  if (!isOutbreak || !animationsEnabled) return undefined;
  if (isNewTile) return 'zombieAbsorb 0.5s cubic-bezier(0.34,1.56,0.64,1)';
  if (obFrontier) return 'zombiePulse 2s ease-in-out infinite';
  return undefined;
}

/**
 * Get icon-specific animation
 */
function getIconAnimation(
  isOutbreak: boolean,
  animationsEnabled: boolean,
  isNewTile: boolean,
  obOwned: boolean
): string | undefined {
  if (isOutbreak && animationsEnabled && isNewTile && obOwned) {
    return 'zombieIconDrop 0.45s cubic-bezier(0.34,1.56,0.64,1)';
  }
  return undefined;
}

/**
 * Get tile animation based on game mode
 */
function getTileAnimation(
  isOutbreak: boolean,
  animationsEnabled: boolean,
  isNewTile: boolean,
  outbreakAnimation: string | undefined
): string | undefined {
  if (isOutbreak) return outbreakAnimation;
  if (isNewTile && animationsEnabled) {
    return 'candyDrop 0.42s cubic-bezier(0.34,1.56,0.64,1)';
  }
  return undefined;
}

/**
 * Get combined transition style for tile
 */
function getTileTransitionStyle(isNewTile: boolean, tileTransition: string): string {
  if (isNewTile) return 'border-color 0.6s ease, box-shadow 0.6s ease';
  return `${tileTransition}, border-color 0.4s ease, box-shadow 0.4s ease`;
}

export {
  getTileTransform,
  getTileTransition,
  getOutbreakAnimation,
  getIconAnimation,
  getTileAnimation,
  getTileTransitionStyle,
};
