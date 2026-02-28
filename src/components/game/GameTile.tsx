import { useState, useRef, useEffect, memo } from 'react';

/**
 * Pipes - Renders the connection lines on each tile
 */
function Pipes({
  connections,
  color,
  glow,
}: {
  connections: Direction[];
  color: string;
  glow: string;
}) {
  return (
    <>
      {connections.includes('up') && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 5,
            height: '53%',
            background: color,
            borderRadius: '3px 3px 0 0',
            boxShadow: `0 0 6px ${glow}`,
          }}
        />
      )}
      {connections.includes('down') && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 5,
            height: '53%',
            background: color,
            borderRadius: '0 0 3px 3px',
            boxShadow: `0 0 6px ${glow}`,
          }}
        />
      )}
      {connections.includes('left') && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            height: 5,
            width: '53%',
            background: color,
            borderRadius: '3px 0 0 3px',
            boxShadow: `0 0 6px ${glow}`,
          }}
        />
      )}
      {connections.includes('right') && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            height: 5,
            width: '53%',
            background: color,
            borderRadius: '0 3px 3px 0',
            boxShadow: `0 0 6px ${glow}`,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 8,
          height: 8,
          background: color,
          borderRadius: '50%',
          boxShadow: `0 0 8px ${glow}`,
        }}
      />
    </>
  );
}

import type { TileRenderer, TileType, Direction } from '@/game/types';

// Inject candy drop + outbreak zombie animation keyframes once into the document
let candyStylesInjected = false;
function ensureCandyStyles() {
  if (candyStylesInjected || typeof document === 'undefined') return;
  candyStylesInjected = true;
  const el = document.createElement('style');
  el.textContent = `
    @keyframes candyDrop {
      0%   { opacity: 0; transform: translateY(-24px) scale(0.75); }
      55%  { opacity: 1; transform: translateY(4px) scale(1.07); }
      80%  { transform: translateY(-2px) scale(1.01); }
      100% { transform: translateY(0) scale(1); }
    }
    @keyframes nodeDangerPulse {
      0%   { box-shadow: 0 0 10px rgba(251,146,60,0.35), inset 0 1px 0 rgba(255,255,255,0.05); }
      50%  { box-shadow: 0 0 28px rgba(251,146,60,0.75), inset 0 1px 0 rgba(255,255,255,0.05); }
      100% { box-shadow: 0 0 10px rgba(251,146,60,0.35), inset 0 1px 0 rgba(255,255,255,0.05); }
    }
    @keyframes zombiePulse {
      0%   { box-shadow: var(--zp-shadow-lo); }
      50%  { box-shadow: var(--zp-shadow-hi); }
      100% { box-shadow: var(--zp-shadow-lo); }
    }
    @keyframes zombieAbsorb {
      0%   { transform: scale(1.18) rotate(-4deg); filter: brightness(2); }
      40%  { transform: scale(0.92) rotate(2deg);  filter: brightness(1.4); }
      70%  { transform: scale(1.05) rotate(-1deg); filter: brightness(1.1); }
      100% { transform: scale(1)    rotate(0deg);  filter: brightness(1); }
    }
    @keyframes zombieIconDrop {
      0%   { opacity: 0; transform: scale(0.4) rotate(-20deg); }
      60%  { opacity: 1; transform: scale(1.2) rotate(6deg); }
      80%  { transform: scale(0.95) rotate(-2deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
    @keyframes zombieShake {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-2px) rotate(-3deg); }
      40%     { transform: translateX(2px)  rotate(3deg); }
      60%     { transform: translateX(-1px) rotate(-1deg); }
      80%     { transform: translateX(1px)  rotate(1deg); }
    }
  `;
  document.head.appendChild(el);
}

export interface GameTileProps {
  readonly id?: string;
  readonly x?: number;
  readonly y?: number;
  readonly type: string;
  readonly connections: Direction[];
  readonly canRotate: boolean;
  readonly isGoalNode: boolean;
  readonly isDecoy?: boolean;
  readonly isHint: boolean;
  readonly inDanger: boolean;
  readonly justRotated?: boolean;
  readonly onClick: () => void;
  readonly tileSize: number;
  readonly animationsEnabled?: boolean;
  /** Optional mode-specific renderer — enables slots, candy crush, match-3, etc. */
  readonly tileRenderer?: TileRenderer;
  readonly displayData?: Record<string, unknown>;
  /** Tap was rejected (isolated tile) — show a brief red flash */
  readonly isRejected?: boolean;
  /** Editor mode - allows clicking on any cell including empty ones */
  readonly editorMode?: boolean;
}

/**
 * GameTile - Individual tile component with visual states and click handling
 * Memoized to prevent unnecessary re-renders
 */
function GameTileComponent({
  id,
  x = 0,
  y = 0,
  type,
  connections,
  canRotate,
  isGoalNode,
  isDecoy = false,
  isHint,
  inDanger,
  justRotated,
  onClick,
  tileSize,
  animationsEnabled = true,
  tileRenderer,
  displayData,
  isRejected = false,
  editorMode = false,
}: GameTileProps) {
  const [pressed, setPressed] = useState(false);
  const [ripple, setRipple] = useState(false);
  const pressedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rippleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ensure danger pulse keyframes are injected (needed for default pipe renderer)
  ensureCandyStyles();

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (pressedTimeoutRef.current) clearTimeout(pressedTimeoutRef.current);
      if (rippleTimeoutRef.current) clearTimeout(rippleTimeoutRef.current);
    };
  }, []);

  const handleClick = () => {
    // In editor mode, always allow clicks. In game mode, only allow on rotatable tiles.
    if (!editorMode && !canRotate) return;

    if (animationsEnabled) {
      setPressed(true);
      setRipple(true);
      if (pressedTimeoutRef.current) clearTimeout(pressedTimeoutRef.current);
      if (rippleTimeoutRef.current) clearTimeout(rippleTimeoutRef.current);
      pressedTimeoutRef.current = setTimeout(() => setPressed(false), 150);
      rippleTimeoutRef.current = setTimeout(() => setRipple(false), 400);
    }

    onClick();
  };

  const r = tileSize > 50 ? 8 : 6;

  const bgStyle = (() => {
    if (type === 'wall')
      return {
        background: 'linear-gradient(145deg, #0e0e1c 0%, #090912 100%)',
        border: '1px solid #131325',
      };
    if (type === 'crushed')
      return {
        background: 'linear-gradient(145deg, #450a0a 0%, #2d0606 100%)',
        border: '2px solid #ef4444',
        boxShadow: '0 0 12px rgba(239,68,68,0.5), inset 0 0 8px rgba(239,68,68,0.2)',
      };
    if (type === 'node')
      return {
        background: inDanger
          ? 'linear-gradient(145deg, #3d0808 0%, #2d0606 100%)'
          : 'linear-gradient(145deg, #14532d 0%, #0f3d21 100%)',
        border: `2px solid ${inDanger ? '#ef4444' : isHint ? '#86efac' : '#22c55e'}`,
        boxShadow: inDanger
          ? '0 0 20px rgba(239,68,68,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 0 14px rgba(34,197,94,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
      };
    // Decoy tiles - blue color like non-rotatable path tiles
    if (type === 'path' && isDecoy)
      return {
        background: isHint
          ? 'linear-gradient(145deg, #1e4060 0%, #153049 100%)'
          : inDanger
            ? 'linear-gradient(145deg, #3d1a1a 0%, #2d1010 100%)'
            : 'linear-gradient(145deg, #1e3060 0%, #172349 100%)',
        border: `2px solid ${isHint ? '#60a5fa' : inDanger ? '#ef4444' : '#3b82f6'}`,
        boxShadow: isHint
          ? '0 0 18px rgba(96,165,250,0.6), inset 0 1px 0 rgba(255,255,255,0.08)'
          : inDanger
            ? '0 0 14px rgba(239,68,68,0.4)'
            : '0 0 10px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
      };
    if (type === 'path' && canRotate)
      return {
        background: isHint
          ? 'linear-gradient(145deg, #7c5c00 0%, #5c4400 100%)'
          : inDanger
            ? 'linear-gradient(145deg, #5c1a1a 0%, #3d1010 100%)'
            : 'linear-gradient(145deg, #78350f 0%, #5c2a0a 100%)',
        border: `2px solid ${isHint ? '#fde68a' : inDanger ? '#ef4444' : '#f59e0b'}`,
        boxShadow: isHint
          ? '0 0 18px rgba(253,230,138,0.6), inset 0 1px 0 rgba(255,255,255,0.08)'
          : inDanger
            ? '0 0 14px rgba(239,68,68,0.4)'
            : '0 0 8px rgba(245,158,11,0.18), inset 0 1px 0 rgba(255,255,255,0.06)',
      };
    if (type === 'path')
      return {
        background: 'linear-gradient(145deg, #1e3060 0%, #172349 100%)',
        border: '1.5px solid #2a4080',
        boxShadow: '0 0 6px rgba(59,130,246,0.12)',
      };
    return { background: 'rgba(10,10,20,0.3)' };
  })();

  const connColor =
    type === 'node'
      ? inDanger
        ? 'rgba(252,165,165,0.9)'
        : 'rgba(134,239,172,0.95)'
      : isDecoy
        ? isHint
          ? 'rgba(147,197,253,0.95)'
          : inDanger
            ? 'rgba(252,165,165,0.9)'
            : 'rgba(147,197,253,0.85)'
        : canRotate
          ? isHint
            ? 'rgba(253,230,138,0.95)'
            : inDanger
              ? 'rgba(252,165,165,0.9)'
              : 'rgba(252,211,77,0.92)'
          : 'rgba(147,197,253,0.85)';

  const connGlow =
    type === 'node'
      ? inDanger
        ? 'rgba(239,68,68,0.6)'
        : 'rgba(34,197,94,0.5)'
      : isDecoy
        ? isHint
          ? 'rgba(96,165,250,0.7)'
          : inDanger
            ? 'rgba(239,68,68,0.5)'
            : 'rgba(59,130,246,0.4)'
        : canRotate
          ? isHint
            ? 'rgba(253,230,138,0.7)'
            : 'rgba(245,158,11,0.5)'
          : 'rgba(59,130,246,0.4)';

  const tileTransform = animationsEnabled
    ? pressed
      ? 'scale(0.84)'
      : justRotated
        ? 'scale(1.08)'
        : 'scale(1)'
    : 'scale(1)';
  const tileTransition = animationsEnabled
    ? pressed
      ? 'transform 0.08s ease'
      : 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)'
    : 'none';

  // ── Custom mode renderer (slots, candy crush, match-3, outbreak, etc.) ────
  if (tileRenderer && tileRenderer.type !== 'pipe') {
    if (tileRenderer.type === 'candy' || tileRenderer.type === 'outbreak') ensureCandyStyles();

    const ctx = {
      isHint,
      inDanger,
      justRotated: Boolean(justRotated),
      compressionActive: false,
      tileSize,
    };
    const tile = {
      id: id ?? `${type}-${x}-${y}`,
      x,
      y,
      type: type as TileType,
      connections: connections as Direction[],
      canRotate,
      isGoalNode,
      justRotated,
      displayData,
    };
    const customColors = tileRenderer.getColors?.(tile, ctx);
    const symbol = tileRenderer.getSymbol?.(tile, ctx);
    const rejectedStyle = isRejected
      ? {
          background: 'linear-gradient(145deg, #2d0808 0%, #1a0000 100%)',
          border: '2px solid #ef4444',
          boxShadow: '0 0 18px rgba(239,68,68,0.7)',
        }
      : null;
    const appliedBg = rejectedStyle ?? customColors ?? bgStyle;

    // isNew: tile just dropped in — play slide animation + glow border transition
    const isNewTile = Boolean(displayData?.isNew);

    // ── Outbreak-specific state flags ────────────────────────────────────────
    const isOutbreak = tileRenderer.type === 'outbreak';
    const obOwned = isOutbreak && Boolean(displayData?.owned);
    const obFrontier = isOutbreak && !obOwned && Boolean(displayData?.isFrontier);
    const obInterior = isOutbreak && !obOwned && !obFrontier;

    // CSS custom properties for the zombiePulse animation (set per-tile color)
    const zpColor = (customColors as Record<string, string> | undefined)?.color ?? '#888';
    const zpShadowLo = (appliedBg as Record<string, string>)?.boxShadow ?? 'none';
    const zpShadowHi = obFrontier
      ? `0 0 22px ${zpColor}cc, 0 0 8px ${zpColor}88, inset 0 0 10px ${zpColor}33`
      : zpShadowLo;

    // Pick the right animation for each outbreak state
    const outbreakAnimation = (() => {
      if (!isOutbreak || !animationsEnabled) return undefined;
      if (isNewTile) return 'zombieAbsorb 0.5s cubic-bezier(0.34,1.56,0.64,1)';
      if (obFrontier) return 'zombiePulse 2s ease-in-out infinite';
      if (obInterior) return undefined; // static — just show the zombie icon
      return undefined;
    })();

    // Icon animation: newly absorbed tiles get a spin-in for the owned icon
    const iconAnimation =
      isOutbreak && animationsEnabled && isNewTile && obOwned
        ? 'zombieIconDrop 0.45s cubic-bezier(0.34,1.56,0.64,1)'
        : undefined;

    // Symbol font size: scale down on small tiles (10×10 grid)
    const symSize = (() => {
      if (!isOutbreak) return tileRenderer.symbolSize ?? '1.2rem';
      if (obOwned) return tileSize <= 36 ? '0.6rem' : tileSize <= 48 ? '0.72rem' : '0.9rem';
      if (obFrontier) {
        // Number label — bold, slightly larger
        return tileSize <= 36 ? '0.65rem' : tileSize <= 48 ? '0.78rem' : '0.95rem';
      }
      // Interior zombie icon
      return tileSize <= 36 ? '0.62rem' : tileSize <= 48 ? '0.75rem' : '0.9rem';
    })();

    return (
      <div
        onClick={handleClick}
        style={{
          borderRadius: r,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: canRotate ? 'pointer' : 'default',
          transform: isNewTile && isOutbreak ? undefined : tileTransform,
          transition: isNewTile
            ? 'border-color 0.6s ease, box-shadow 0.6s ease'
            : `${tileTransition}, border-color 0.4s ease, box-shadow 0.4s ease`,
          animation: isOutbreak
            ? outbreakAnimation
            : isNewTile && animationsEnabled
              ? 'candyDrop 0.42s cubic-bezier(0.34,1.56,0.64,1)'
              : undefined,
          fontSize: symSize,
          fontWeight: isOutbreak && obFrontier ? 700 : undefined,
          // CSS vars for zombiePulse keyframe
          ['--zp-shadow-lo' as string]: zpShadowLo,
          ['--zp-shadow-hi' as string]: zpShadowHi,
          ...appliedBg,
          overflow: 'hidden',
        }}
      >
        {symbol && (
          <span
            style={{
              zIndex: 1,
              userSelect: 'none',
              display: 'block',
              lineHeight: 1,
              animation: iconAnimation,
              // Dim interior zombie icons slightly so they don't compete with frontier numbers
              opacity: isOutbreak && obInterior ? 0.55 : 1,
              filter:
                isOutbreak && obOwned && !isNewTile
                  ? 'drop-shadow(0 0 3px rgba(255,255,255,0.3))'
                  : undefined,
            }}
          >
            {symbol}
          </span>
        )}
        {!tileRenderer.hidePipes &&
          connections.length > 0 &&
          type !== 'wall' &&
          type !== 'crushed' && (
            <Pipes connections={connections} color={connColor} glow={connGlow} />
          )}
      </div>
    );
  }

  // ── Default pipe renderer ─────────────────────────────────────────────────
  return (
    <div
      onClick={handleClick}
      style={{
        borderRadius: r,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: editorMode ? 'pointer' : canRotate ? 'pointer' : 'default',
        transform: tileTransform,
        transition: tileTransition,
        ...bgStyle,
        overflow: 'hidden',
      }}
    >
      {/* Ripple effect */}
      {ripple && canRotate && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: r,
            background: 'rgba(255,255,255,0.12)',
            opacity: 0,
            transition: 'opacity 0.4s ease',
          }}
        />
      )}

      {/* Pipe connections */}
      {connections.length > 0 && type !== 'wall' && type !== 'crushed' && type !== 'empty' && (
        <Pipes connections={connections} color={connColor} glow={connGlow} />
      )}

      {/* Goal node indicator ring */}
      {isGoalNode && type === 'node' && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: '40%',
            height: '40%',
            border: `2px solid ${inDanger ? 'rgba(252,165,165,0.5)' : 'rgba(134,239,172,0.5)'}`,
            borderRadius: '50%',
            zIndex: 1,
          }}
        />
      )}

      {/* Check if this tile is a decoy */}
      {(() => {
        const isDecoy = displayData?.isDecoy === true;
        return (
          <>
            {/* Rotatable indicator dot - hidden for decoys */}
            {canRotate && !isDecoy && (
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: isHint ? '#fde68a' : inDanger ? '#fca5a5' : '#fcd34d',
                  boxShadow: `0 0 4px ${isHint ? 'rgba(253,230,138,0.8)' : 'rgba(252,211,77,0.6)'}`,
                }}
              />
            )}

            {/* Decoy indicator - circle outline */}
            {isDecoy && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '70%',
                  height: '70%',
                  borderRadius: '50%',
                  border: `2px solid ${isHint ? 'rgba(253,230,138,0.6)' : inDanger ? 'rgba(252,165,165,0.5)' : 'rgba(252,211,77,0.4)'}`,
                  boxShadow: `0 0 6px ${isHint ? 'rgba(253,230,138,0.3)' : inDanger ? 'rgba(239,68,68,0.3)' : 'rgba(252,211,77,0.2)'}`,
                  pointerEvents: 'none',
                }}
              />
            )}
          </>
        );
      })()}

      {/* Crushed tile X marker */}
      {type === 'crushed' && (
        <div
          style={{
            fontSize: tileSize > 40 ? 14 : 10,
            color: '#ef4444',
            fontWeight: 900,
            zIndex: 1,
            textShadow: '0 0 6px rgba(239,68,68,0.8)',
          }}
        >
          ✕
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const GameTile = memo(GameTileComponent);
export default GameTile;
