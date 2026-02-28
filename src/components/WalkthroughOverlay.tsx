// PRESSURE - Walkthrough Overlay
// Interactive step-by-step guide for first levels.
// Highlights tiles and shows instructions during actual gameplay.

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../game/store';

/* ═══════════════════════════════════════════════════════════════════════════
   WALKTHROUGH STEP TYPE
═══════════════════════════════════════════════════════════════════════════ */

export interface WalkthroughStep {
  /** Unique identifier for this step */
  id: string;
  /** Target tile position to highlight (optional) */
  targetTile?: { x: number; y: number };
  /** Instruction text to display */
  instruction: string;
  /** Optional title */
  title?: string;
  /** Position of the tooltip relative to target */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Condition to check before advancing (optional) */
  advanceOn?: 'tap' | 'rotate' | 'connect' | 'score' | 'manual';
  /** Optional: only show when this condition is met */
  showWhen?: (state: {
    moves: number;
    score: number;
    tiles: unknown[];
    modeState?: Record<string, unknown>;
  }) => boolean;
}

export interface WalkthroughConfig {
  /** Mode ID this walkthrough applies to */
  modeId: string;
  /** Level ID this walkthrough is for (usually first level) */
  levelId: number;
  /** Steps in the walkthrough */
  steps: WalkthroughStep[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   WALKTHROUGH OVERLAY COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

interface WalkthroughOverlayProps {
  readonly steps: WalkthroughStep[];
  readonly currentStepIndex: number;
  readonly onAdvance: () => void;
  readonly onSkip: () => void;
  readonly targetTile?: { x: number; y: number };
  readonly boardRef: React.RefObject<HTMLDivElement | null>;
  readonly gridSize: number;
}

export function WalkthroughOverlay({
  steps,
  currentStepIndex,
  onAdvance,
  onSkip,
  targetTile,
  boardRef,
  gridSize,
  onStartGame,
}: WalkthroughOverlayProps & { onStartGame?: () => void }) {
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  // Calculate highlight position based on tile coordinates
  useEffect(() => {
    if (!boardRef.current || !targetTile) {
      setHighlightRect(null);
      return;
    }

    const board = boardRef.current;
    const boardRect = board.getBoundingClientRect();

    // Gap is applied between cells via CSS grid-gap
    const gap = gridSize >= 9 ? 2 : gridSize > 5 ? 3 : 4;

    // Calculate actual tile size (same formula as GameBoard)
    const padding = gridSize >= 9 ? 4 : gridSize > 5 ? 8 : 10;
    const tileSize = Math.floor((boardRect.width - padding * 2 - gap * (gridSize - 1)) / gridSize);

    // Position: padding offset + (tile index * (tileSize + gap))
    const x = padding + targetTile.x * (tileSize + gap);
    const y = padding + targetTile.y * (tileSize + gap);

    // Offset by 1px right and 1px down for better alignment
    setHighlightRect(
      new DOMRect(boardRect.left + x + 2, boardRect.top + y + 2, tileSize, tileSize)
    );
  }, [targetTile, boardRef, gridSize]);

  // Calculate tooltip position
  useEffect(() => {
    if (!currentStep) {
      setTooltipPos(null);
      return;
    }

    const position = currentStep.position || 'bottom';
    const offset = 20;
    const tooltipWidth = 280;
    const tooltipHeight = 200; // Approximate height

    let x: number;
    let y: number;

    // If we have a highlight rect and position is not center, position relative to it
    if (highlightRect && position !== 'center') {
      x = highlightRect.left + highlightRect.width / 2;
      y = highlightRect.top + highlightRect.height / 2;

      switch (position) {
        case 'top':
          y = highlightRect.top - offset - tooltipHeight / 2;
          break;
        case 'bottom':
          y = highlightRect.bottom + offset + tooltipHeight / 2;
          break;
        case 'left':
          x = highlightRect.left - offset - tooltipWidth / 2;
          break;
        case 'right':
          x = highlightRect.right + offset + tooltipWidth / 2;
          break;
      }
    } else {
      // Position at center of screen for steps without targetTile (intro steps)
      x = globalThis.innerWidth / 2;
      y = globalThis.innerHeight / 2;
    }

    // Clamp to screen bounds with padding
    const padding = 20;
    x = Math.max(
      tooltipWidth / 2 + padding,
      Math.min(globalThis.innerWidth - tooltipWidth / 2 - padding, x)
    );
    y = Math.max(
      tooltipHeight / 2 + padding,
      Math.min(globalThis.innerHeight - tooltipHeight / 2 - padding, y)
    );

    setTooltipPos({ x, y });
  }, [highlightRect, currentStep]);

  if (!currentStep || !tooltipPos) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
      {/* Full-screen dark overlay for center-positioned steps */}
      {!highlightRect && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            pointerEvents: 'auto',
          }}
          onClick={onSkip}
        />
      )}
      {/* Darkened overlay with cutout for highlight */}
      {highlightRect && (
        <>
          {/* Top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: highlightRect.top,
              background: 'rgba(0,0,0,0.6)',
              pointerEvents: 'auto',
            }}
            onClick={onSkip}
          />
          {/* Bottom */}
          <div
            style={{
              position: 'absolute',
              top: highlightRect.bottom,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              pointerEvents: 'auto',
            }}
            onClick={onSkip}
          />
          {/* Left */}
          <div
            style={{
              position: 'absolute',
              top: highlightRect.top,
              left: 0,
              width: highlightRect.left,
              height: highlightRect.height,
              background: 'rgba(0,0,0,0.6)',
              pointerEvents: 'auto',
            }}
            onClick={onSkip}
          />
          {/* Right */}
          <div
            style={{
              position: 'absolute',
              top: highlightRect.top,
              left: highlightRect.right,
              right: 0,
              height: highlightRect.height,
              background: 'rgba(0,0,0,0.6)',
              pointerEvents: 'auto',
            }}
            onClick={onSkip}
          />
          {/* Highlight ring */}
          <div
            style={{
              position: 'absolute',
              left: highlightRect.left - 2,
              top: highlightRect.top - 2,
              width: highlightRect.width + 4,
              height: highlightRect.height + 4,
              border: '2px solid #fbbf24',
              borderRadius: 10,
              boxShadow: '0 0 16px rgba(251,191,36,0.6)',
              animation: 'pulse 1.5s ease-in-out infinite',
              zIndex: 10,
            }}
          />
        </>
      )}

      {/* Tooltip */}
      <div
        style={{
          position: 'absolute',
          left: tooltipPos.x,
          top: tooltipPos.y,
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(145deg, #1a1a2e, #0f0f1a)',
          border: '1px solid #fbbf2440',
          borderRadius: 16,
          padding: '16px 20px',
          maxWidth: 280,
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 20px rgba(251,191,36,0.2)',
          pointerEvents: 'auto',
          zIndex: 200,
        }}
      >
        {/* Step indicator */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 12,
          }}
        >
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentStepIndex ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background:
                  i === currentStepIndex ? '#fbbf24' : i < currentStepIndex ? '#3a3a55' : '#1a1a2e',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>

        {/* Title */}
        {currentStep.title && (
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: '#fbbf24',
              letterSpacing: '0.05em',
              marginBottom: 8,
            }}
          >
            {currentStep.title}
          </div>
        )}

        {/* Instruction */}
        <div
          style={{
            fontSize: 13,
            color: '#a5b4fc',
            lineHeight: 1.6,
            marginBottom: 16,
          }}
        >
          {currentStep.instruction}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {!isLastStep && (
            <button
              onClick={onSkip}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid #3a3a55',
                background: 'transparent',
                color: '#3a3a55',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              SKIP
            </button>
          )}
          <button
            onClick={() => {
              onAdvance();
              if (isLastStep && onStartGame) {
                onStartGame();
              }
            }}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              color: '#000',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 16px rgba(251,191,36,0.4)',
            }}
          >
            {isLastStep ? 'PLAY' : 'NEXT'}
          </button>
        </div>
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WALKTHROUGH MANAGER HOOK
   Manages walkthrough state and progression
═══════════════════════════════════════════════════════════════════════════ */

export function useWalkthrough(
  config: WalkthroughConfig | null,
  _boardRef: React.RefObject<HTMLDivElement | null>
) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasSeenWalkthrough, setHasSeenWalkthrough] = useState(() => {
    if (typeof window === 'undefined') return false;
    const seen = localStorage.getItem(`walkthrough-${config?.modeId}-${config?.levelId}`);
    return seen === 'true';
  });

  const tiles = useGameStore((s) => s.tiles);
  const moves = useGameStore((s) => s.moves);
  const score = useGameStore((s) => s.score);
  const modeState = useGameStore((s) => s.modeState);
  const status = useGameStore((s) => s.status);
  const currentLevel = useGameStore((s) => s.currentLevel);
  const currentModeId = useGameStore((s) => s.currentModeId);
  const replayWalkthrough = useGameStore((s) => s._replayWalkthrough);

  // Start walkthrough when level is loaded (idle only) and no moves made
  // Also trigger when replayWalkthrough timestamp changes
  useEffect(() => {
    if (
      config &&
      status === 'idle' &&
      currentLevel?.id === config.levelId &&
      currentModeId === config.modeId &&
      (!hasSeenWalkthrough || replayWalkthrough) &&
      moves === 0
    ) {
      setIsActive(true);
      setCurrentStepIndex(0);
      // Clear the replay trigger after starting
      if (replayWalkthrough) {
        setHasSeenWalkthrough(false);
      }
    }
  }, [config, status, currentLevel, currentModeId, hasSeenWalkthrough, moves, replayWalkthrough]);

  // Check if current step's showWhen condition is met
  const currentStep = config?.steps[currentStepIndex];
  const shouldShowStep = useCallback(() => {
    if (!currentStep?.showWhen) return true;
    return currentStep.showWhen({ moves, score, tiles, modeState });
  }, [currentStep, moves, score, tiles, modeState]);

  // Advance to next step
  const advance = useCallback(() => {
    if (!config) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= config.steps.length) {
      // Walkthrough complete - clear the replay trigger from the store
      useGameStore.setState({ _replayWalkthrough: undefined });
      setIsActive(false);
      setHasSeenWalkthrough(true);
      localStorage.setItem(`walkthrough-${config.modeId}-${config.levelId}`, 'true');
    } else {
      setCurrentStepIndex(nextIndex);
    }
  }, [config, currentStepIndex]);

  // Skip walkthrough
  const skip = useCallback(() => {
    if (!config) return;
    // Clear the replay trigger from the store
    useGameStore.setState({ _replayWalkthrough: undefined });
    setIsActive(false);
    setHasSeenWalkthrough(true);
    localStorage.setItem(`walkthrough-${config.modeId}-${config.levelId}`, 'true');
  }, [config]);

  // Auto-advance on certain conditions
  useEffect(() => {
    if (!isActive || !currentStep) return;

    // Check showWhen condition - skip to next if not met
    if (currentStep.showWhen && !shouldShowStep()) {
      // Don't auto-skip, just wait
      return;
    }

    // Auto-advance based on advanceOn type
    if (currentStep.advanceOn === 'tap' && moves > 0) {
      // Small delay to let the player see what happened
      setTimeout(advance, 500);
    }
  }, [isActive, currentStep, moves, shouldShowStep, advance]);

  // Restart walkthrough (for testing)
  const restart = useCallback(() => {
    if (!config) return;
    setIsActive(true);
    setCurrentStepIndex(0);
    setHasSeenWalkthrough(false);
    localStorage.removeItem(`walkthrough-${config.modeId}-${config.levelId}`);
  }, [config]);

  return {
    isActive,
    currentStepIndex,
    currentStep,
    advance,
    skip,
    restart,
    hasSeenWalkthrough,
  };
}
