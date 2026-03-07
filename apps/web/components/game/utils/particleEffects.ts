/**
 * Particle effect utilities
 * Pure functions for particle burst animations
 */

/**
 * Get particle burst color for win animation
 */
function getParticleBurstColor(index: number): string {
  const colors = ['#22c55e', '#a5b4fc', '#fbbf24'];
  return colors[index % 3];
}

/**
 * Get particle shape for burst effect
 */
function getParticleBurstShape(index: number): 'star' | 'circle' {
  return index % 2 === 0 ? 'star' : 'circle';
}

export { getParticleBurstColor, getParticleBurstShape };
