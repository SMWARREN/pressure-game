/**
 * Pipe segment rendering utilities
 * Pure functions for computing pipe segment styles
 */

interface PipeSegmentStyle {
  readonly position: 'up' | 'down' | 'left' | 'right';
  readonly color: string;
  readonly glow: string;
}

/**
 * Get CSS styles for a pipe segment in a specific direction
 */
function getPipeSegmentStyle(
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

export {
  getPipeSegmentStyle,
  type PipeSegmentStyle,
};
