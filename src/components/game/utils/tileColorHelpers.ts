/**
 * Tile color and glow utilities
 * Pure functions for computing tile colors based on state
 */

import { selectByCondition } from '@/utils/conditionalStyles';

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
  return selectByCondition([isHint, '#fde68a'], [inDanger, '#fca5a5'], [true, '#fcd34d']);
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
  return selectByCondition(
    [isHint, 'rgba(253,230,138,0.6)'],
    [inDanger, 'rgba(252,165,165,0.5)'],
    [true, 'rgba(252,211,77,0.4)']
  );
}

/**
 * Get decoy box shadow
 */
function getDecoyBoxShadow(isHint: boolean, inDanger: boolean): string {
  return selectByCondition(
    [isHint, '0 0 6px rgba(253,230,138,0.3)'],
    [inDanger, '0 0 6px rgba(239,68,68,0.3)'],
    [true, '0 0 6px rgba(252,211,77,0.2)']
  );
}

/**
 * Get node border color based on state
 */
function getNodeBorderColor(isHint: boolean, inDanger: boolean, isDecoy: boolean): string {
  if (isDecoy) {
    return selectByCondition([isHint, '#60a5fa'], [inDanger, '#ef4444'], [true, '#3b82f6']);
  }
  return selectByCondition([inDanger, '#ef4444'], [isHint, '#86efac'], [true, '#22c55e']);
}

/**
 * Get path border color based on state
 */
function getPathBorderColor(isHint: boolean, inDanger: boolean, canRotate: boolean): string {
  return selectByCondition(
    [isHint, '#fde68a'],
    [inDanger, '#ef4444'],
    [canRotate, '#f59e0b'],
    [true, 'rgba(255,255,255,0)']
  );
}

/**
 * Get tile background style (gradient, border, boxShadow) based on tile type and state
 * Consolidates complex nested ternaries into single function
 */
function getTileBackgroundStyle(
  type: string,
  isHint: boolean,
  inDanger: boolean,
  isDecoy: boolean,
  canRotate: boolean
): React.CSSProperties {
  if (type === 'wall') {
    return {
      background: 'linear-gradient(145deg, #0e0e1c 0%, #090912 100%)',
      border: '1px solid #131325',
    };
  }
  if (type === 'crushed') {
    return {
      background: 'linear-gradient(145deg, #450a0a 0%, #2d0606 100%)',
      border: '2px solid #ef4444',
      boxShadow: '0 0 12px rgba(239,68,68,0.5), inset 0 0 8px rgba(239,68,68,0.2)',
    };
  }
  if (type === 'node') {
    return {
      background: inDanger
        ? 'linear-gradient(145deg, #3d0808 0%, #2d0606 100%)'
        : 'linear-gradient(145deg, #14532d 0%, #0f3d21 100%)',
      border: `2px solid ${getNodeBorderColor(isHint, inDanger, false)}`,
      boxShadow: inDanger
        ? '0 0 20px rgba(239,68,68,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
        : '0 0 14px rgba(34,197,94,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
    };
  }
  if (type === 'path' && isDecoy) {
    const bg = selectByCondition(
      [isHint, 'linear-gradient(145deg, #1e4060 0%, #153049 100%)'],
      [inDanger, 'linear-gradient(145deg, #3d1a1a 0%, #2d1010 100%)'],
      [true, 'linear-gradient(145deg, #1e3060 0%, #172349 100%)']
    );
    const borderColor = selectByCondition(
      [isHint, '#60a5fa'],
      [inDanger, '#ef4444'],
      [true, '#3b82f6']
    );
    const shadow = selectByCondition(
      [isHint, '0 0 18px rgba(96,165,250,0.6), inset 0 1px 0 rgba(255,255,255,0.08)'],
      [inDanger, '0 0 14px rgba(239,68,68,0.4)'],
      [true, '0 0 10px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.06)']
    );
    return { background: bg, border: `2px solid ${borderColor}`, boxShadow: shadow };
  }
  if (type === 'path' && canRotate) {
    const bg = selectByCondition(
      [isHint, 'linear-gradient(145deg, #7c5c00 0%, #5c4400 100%)'],
      [inDanger, 'linear-gradient(145deg, #5c1a1a 0%, #3d1010 100%)'],
      [true, 'linear-gradient(145deg, #78350f 0%, #5c2a0a 100%)']
    );
    const borderColor = selectByCondition(
      [isHint, '#fde68a'],
      [inDanger, '#ef4444'],
      [true, '#f59e0b']
    );
    const shadow = selectByCondition(
      [isHint, '0 0 18px rgba(253,230,138,0.6), inset 0 1px 0 rgba(255,255,255,0.08)'],
      [inDanger, '0 0 14px rgba(239,68,68,0.4)'],
      [true, '0 0 8px rgba(245,158,11,0.18), inset 0 1px 0 rgba(255,255,255,0.06)']
    );
    return { background: bg, border: `2px solid ${borderColor}`, boxShadow: shadow };
  }
  if (type === 'path') {
    return {
      background: 'linear-gradient(145deg, #1e3060 0%, #172349 100%)',
      border: '1.5px solid #2a4080',
      boxShadow: '0 0 6px rgba(59,130,246,0.12)',
    };
  }
  return { background: 'rgba(10,10,20,0.3)' };
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
  getTileBackgroundStyle,
  type TileStyleContext,
};
