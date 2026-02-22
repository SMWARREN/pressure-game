/**
 * WallOverlay - Animated visual effect showing walls closing in
 *
 * This creates the "pressure effect" - red gradient overlays on all four sides
 * that grow based on wallOffset, creating the visual of walls closing in.
 */

interface WallOverlayProps {
  wallOffset: number;
  gridSize: number;
  wallsJustAdvanced: boolean;
  isPlaying: boolean;
  animationsEnabled?: boolean;
}

export default function WallOverlay({
  wallOffset,
  gridSize,
  wallsJustAdvanced,
  isPlaying,
  animationsEnabled = true,
}: WallOverlayProps) {
  if (!isPlaying || wallOffset <= 0) return null;

  const percentage = (wallOffset / gridSize) * 100;
  const transform = animationsEnabled && wallsJustAdvanced ? '2px' : '0';
  const transition = animationsEnabled ? 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none';
  const boxShadow =
    animationsEnabled && wallsJustAdvanced ? '0 4px 20px rgba(239,68,68,0.4)' : 'none';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        borderRadius: 18,
        overflow: 'hidden',
      }}
    >
      {/* Top wall */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${percentage}%`,
          background: 'linear-gradient(180deg, rgba(239,68,68,0.15) 0%, transparent 100%)',
          borderBottom: '2px solid rgba(239,68,68,0.3)',
          transform: wallsJustAdvanced ? `translateY(${transform})` : 'translateY(0)',
          transition,
          boxShadow,
        }}
      />

      {/* Bottom wall */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${percentage}%`,
          background: 'linear-gradient(0deg, rgba(239,68,68,0.15) 0%, transparent 100%)',
          borderTop: '2px solid rgba(239,68,68,0.3)',
          transform: wallsJustAdvanced ? `translateY(-${transform})` : 'translateY(0)',
          transition,
          boxShadow: wallsJustAdvanced ? '0 -4px 20px rgba(239,68,68,0.4)' : 'none',
        }}
      />

      {/* Left wall */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${percentage}%`,
          background: 'linear-gradient(90deg, rgba(239,68,68,0.15) 0%, transparent 100%)',
          borderRight: '2px solid rgba(239,68,68,0.3)',
          transform: wallsJustAdvanced ? `translateX(${transform})` : 'translateX(0)',
          transition,
          boxShadow: wallsJustAdvanced ? '4px 0 20px rgba(239,68,68,0.4)' : 'none',
        }}
      />

      {/* Right wall */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: `${percentage}%`,
          background: 'linear-gradient(270deg, rgba(239,68,68,0.15) 0%, transparent 100%)',
          borderLeft: '2px solid rgba(239,68,68,0.3)',
          transform: wallsJustAdvanced ? `translateX(-${transform})` : 'translateX(0)',
          transition,
          boxShadow: wallsJustAdvanced ? '-4px 0 20px rgba(239,68,68,0.4)' : 'none',
        }}
      />
    </div>
  );
}
