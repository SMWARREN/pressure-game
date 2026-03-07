/**
 * Pipe segment rendering utilities
 * Pure functions for computing pipe segment styles
 */

type PipeDirection = 'up' | 'down' | 'left' | 'right';

interface PipeSegmentStyle {
  readonly position: PipeDirection;
  readonly color: string;
  readonly glow: string;
}

// Base styles for pipe segments
const BASE_SEGMENT: React.CSSProperties = {
  position: 'absolute',
  width: 5,
  height: 5,
};

// Direction-specific pipe segment styles (replaces switch statement)
const PIPE_SEGMENT_STYLES: Record<PipeDirection, React.CSSProperties> = {
  up: {
    ...BASE_SEGMENT,
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 5,
    height: '53%',
    borderRadius: '3px 3px 0 0',
  },
  down: {
    ...BASE_SEGMENT,
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 5,
    height: '53%',
    borderRadius: '0 0 3px 3px',
  },
  left: {
    ...BASE_SEGMENT,
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    height: 5,
    width: '53%',
    borderRadius: '3px 0 0 3px',
  },
  right: {
    ...BASE_SEGMENT,
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    height: 5,
    width: '53%',
    borderRadius: '0 3px 3px 0',
  },
};

/**
 * Get CSS styles for a pipe segment in a specific direction
 */
function getPipeSegmentStyle(direction: PipeDirection): React.CSSProperties {
  return PIPE_SEGMENT_STYLES[direction];
}

export { getPipeSegmentStyle, type PipeSegmentStyle };
