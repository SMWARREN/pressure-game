// Shared walkthrough types used by game modes
// This file can be imported by both game logic and UI components

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
