/**
 * GameTile style and color utilities
 * Extracted helpers to eliminate nested ternaries
 */

interface TileStyleContext {
  readonly type: string;
  readonly isHint: boolean;
  readonly inDanger: boolean;
  readonly isDecoy: boolean;
  readonly canRotate: boolean;
  readonly tileSize: number;
}

export function getConnColor(ctx: TileStyleContext): string {
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

export function getConnGlow(ctx: TileStyleContext): string {
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

export function getSymbolSize(
  isOutbreak: boolean,
  tileSize: number,
  obOwned: boolean,
  obFrontier: boolean
): string {
  if (!isOutbreak) return '1.2rem';
  if (obOwned) {
    if (tileSize <= 36) return '0.6rem';
    if (tileSize <= 48) return '0.72rem';
    return '0.9rem';
  }
  if (obFrontier) {
    if (tileSize <= 36) return '0.65rem';
    if (tileSize <= 48) return '0.78rem';
    return '0.95rem';
  }
  if (tileSize <= 36) return '0.62rem';
  if (tileSize <= 48) return '0.75rem';
  return '0.9rem';
}

export function getTileTransform(
  animationsEnabled: boolean | undefined,
  pressed: boolean,
  justRotated: boolean | undefined
): string {
  if (!animationsEnabled) return 'scale(1)';
  if (pressed) return 'scale(0.84)';
  if (justRotated) return 'scale(1.08)';
  return 'scale(1)';
}

export function getTileTransition(
  animationsEnabled: boolean | undefined,
  pressed: boolean
): string {
  if (!animationsEnabled) return 'none';
  if (pressed) return 'transform 0.08s ease';
  return 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)';
}

export function getOutbreakAnimation(
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

export function getIconAnimation(
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

export function getTileAnimation(
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

export function getTileTransitionStyle(
  isNewTile: boolean,
  tileTransition: string
): string {
  if (isNewTile) return 'border-color 0.6s ease, box-shadow 0.6s ease';
  return `${tileTransition}, border-color 0.4s ease, box-shadow 0.4s ease`;
}

export function getGapValue(gridSize: number): number {
  if (gridSize >= 9) return 2;
  if (gridSize > 5) return 3;
  return 4;
}

export function getPaddingValue(gridSize: number): number {
  if (gridSize >= 9) return 4;
  if (gridSize > 5) return 8;
  return 10;
}

export function getStepBackground(
  step: number,
  currentStep: number,
  accentColor: string
): string {
  if (step === currentStep) return accentColor;
  if (step < currentStep) return '#3a3a55';
  return '#1a1a2e';
}

export function getStatusBackgroundColor(status: string): string {
  switch (status) {
    case 'playing':
      return '#10b98120';
    case 'won':
      return '#22c55e20';
    case 'lost':
      return '#ef444420';
    default:
      return '#f59e0b20';
  }
}

export function getStatusBorderColor(status: string): string {
  switch (status) {
    case 'playing':
      return '#10b98140';
    case 'won':
      return '#22c55e40';
    case 'lost':
      return '#ef444440';
    default:
      return '#f59e0b40';
  }
}

export function getStatusTextColor(status: string): string {
  switch (status) {
    case 'playing':
      return '#10b981';
    case 'won':
      return '#22c55e';
    case 'lost':
      return '#ef4444';
    default:
      return '#f59e0b';
  }
}

export function getChargeIndicator(
  charge: number,
  overloadThreshold: number = 8
): string {
  if (charge >= overloadThreshold) return '#ef4444'; // Red - overload
  if (charge >= overloadThreshold * 0.75) return '#f59e0b'; // Amber - warning
  if (charge >= overloadThreshold * 0.5) return '#fbbf24'; // Yellow - caution
  return '#3b82f6'; // Blue - normal
}

export function getCursorStyle(
  editorMode: boolean,
  canRotate: boolean
): string {
  if (editorMode) return 'pointer';
  if (canRotate) return 'pointer';
  return 'default';
}

export function getIndicatorColor(isHint: boolean, inDanger: boolean): string {
  if (isHint) return '#fde68a';
  if (inDanger) return '#fca5a5';
  return '#fcd34d';
}

export function getIndicatorGlow(isHint: boolean): string {
  return isHint
    ? 'rgba(253,230,138,0.8)'
    : 'rgba(252,211,77,0.6)';
}

export function getDecoyBorderColor(isHint: boolean, inDanger: boolean): string {
  if (isHint) return 'rgba(253,230,138,0.6)';
  if (inDanger) return 'rgba(252,165,165,0.5)';
  return 'rgba(252,211,77,0.4)';
}

export function getDecoyBoxShadow(isHint: boolean, inDanger: boolean): string {
  if (isHint) return '0 0 6px rgba(253,230,138,0.3)';
  if (inDanger) return '0 0 6px rgba(239,68,68,0.3)';
  return '0 0 6px rgba(252,211,77,0.2)';
}

export function getNodeBorderColor(isHint: boolean, inDanger: boolean, isDecoy: boolean): string {
  if (isDecoy) {
    if (isHint) return '#60a5fa';
    if (inDanger) return '#ef4444';
    return '#3b82f6';
  }
  if (inDanger) return '#ef4444';
  if (isHint) return '#86efac';
  return '#22c55e';
}

export function getPathBorderColor(isHint: boolean, inDanger: boolean, canRotate: boolean): string {
  if (isHint) return '#fde68a';
  if (inDanger) return '#ef4444';
  if (canRotate) return '#f59e0b';
  return 'rgba(255,255,255,0)';
}

export interface PipeSegmentStyle {
  readonly position: 'up' | 'down' | 'left' | 'right';
  readonly color: string;
  readonly glow: string;
}

export function getPipeSegmentStyle(
  direction: 'up' | 'down' | 'left' | 'right'
): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: 5,
    height: 5,
  };

  switch (direction) {
    case 'up':
      return {
        ...base,
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 5,
        height: '53%',
        borderRadius: '3px 3px 0 0',
      };
    case 'down':
      return {
        ...base,
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 5,
        height: '53%',
        borderRadius: '0 0 3px 3px',
      };
    case 'left':
      return {
        ...base,
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        height: 5,
        width: '53%',
        borderRadius: '3px 0 0 3px',
      };
    case 'right':
      return {
        ...base,
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        height: 5,
        width: '53%',
        borderRadius: '0 3px 3px 0',
      };
  }
}
