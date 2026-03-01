/**
 * Tile color and glow utilities
 * Pure functions for computing tile colors based on state
 */

interface TileStyleContext {
  readonly type: string;
  readonly isHint: boolean;
  readonly inDanger: boolean;
  readonly isDecoy: boolean;
  readonly canRotate: boolean;
  readonly tileSize: number;
}

/**
 * Get connection color based on tile context
 */
function getConnColor(ctx: TileStyleContext): string {
  if (ctx.type === 'node') {
    return ctx.inDanger ? 'rgba(252,165,165,0.9)' : 'rgba(134,239,172,0.95)';
  }
  if (ctx.isDecoy) {
    if (ctx.isHint) return 'rgba(147,197,253,0.95)';
    if (ctx.inDanger) return 'rgba(252,165,165,0.9)';
    return 'rgba(147,197,253,0.85)';
  }
  if (ctx.canRotate) {
    if (ctx.isHint) return 'rgba(253,230,138,0.95)';
    if (ctx.inDanger) return 'rgba(252,165,165,0.9)';
    return 'rgba(252,211,77,0.92)';
  }
  return 'rgba(147,197,253,0.85)';
}

/**
 * Get glow color for connections
 */
function getConnGlow(ctx: TileStyleContext): string {
  if (ctx.type === 'node') {
    return ctx.inDanger ? 'rgba(239,68,68,0.6)' : 'rgba(34,197,94,0.5)';
  }
  if (ctx.isDecoy) {
    if (ctx.isHint) return 'rgba(96,165,250,0.7)';
    if (ctx.inDanger) return 'rgba(239,68,68,0.5)';
    return 'rgba(59,130,246,0.4)';
  }
  if (ctx.canRotate) {
    if (ctx.isHint) return 'rgba(253,230,138,0.7)';
    return 'rgba(245,158,11,0.5)';
  }
  return 'rgba(59,130,246,0.4)';
}

/**
 * Get indicator color for hint/danger states
 */
function getIndicatorColor(isHint: boolean, inDanger: boolean): string {
  if (isHint) return '#fde68a';
  if (inDanger) return '#fca5a5';
  return '#fcd34d';
}

/**
 * Get hint indicator glow color
 */
function getHintIndicatorGlow(): string {
  return 'rgba(253,230,138,0.8)';
}

/**
 * Get normal indicator glow color
 */
function getNormalIndicatorGlow(): string {
  return 'rgba(252,211,77,0.6)';
}

/**
 * Get decoy border color
 */
function getDecoyBorderColor(isHint: boolean, inDanger: boolean): string {
  if (isHint) return 'rgba(253,230,138,0.6)';
  if (inDanger) return 'rgba(252,165,165,0.5)';
  return 'rgba(252,211,77,0.4)';
}

/**
 * Get decoy box shadow
 */
function getDecoyBoxShadow(isHint: boolean, inDanger: boolean): string {
  if (isHint) return '0 0 6px rgba(253,230,138,0.3)';
  if (inDanger) return '0 0 6px rgba(239,68,68,0.3)';
  return '0 0 6px rgba(252,211,77,0.2)';
}

/**
 * Get node border color based on state
 */
function getNodeBorderColor(isHint: boolean, inDanger: boolean, isDecoy: boolean): string {
  if (isDecoy) {
    if (isHint) return '#60a5fa';
    if (inDanger) return '#ef4444';
    return '#3b82f6';
  }
  if (inDanger) return '#ef4444';
  if (isHint) return '#86efac';
  return '#22c55e';
}

/**
 * Get path border color based on state
 */
function getPathBorderColor(isHint: boolean, inDanger: boolean, canRotate: boolean): string {
  if (isHint) return '#fde68a';
  if (inDanger) return '#ef4444';
  if (canRotate) return '#f59e0b';
  return 'rgba(255,255,255,0)';
}

export {
  getConnColor,
  getConnGlow,
  getIndicatorColor,
  getHintIndicatorGlow,
  getNormalIndicatorGlow,
  getDecoyBorderColor,
  getDecoyBoxShadow,
  getNodeBorderColor,
  getPathBorderColor,
  type TileStyleContext,
};
