import React from 'react';
import { View } from 'react-native';
import type { CompressionDirection } from '@/game/types';

interface WallOverlayProps {
  readonly wallOffset: number;
  readonly gridCols: number;
  readonly gridRows: number;
  readonly tileSize: number;
  readonly gap: number;
  readonly isPlaying: boolean;
  readonly compressionDirection?: CompressionDirection;
}

export default function WallOverlay({
  wallOffset,
  gridCols,
  gridRows,
  tileSize,
  gap,
  isPlaying,
  compressionDirection = 'all',
}: WallOverlayProps) {
  if (!isPlaying || wallOffset <= 0) return null;

  const showTop = ['all', 'top', 'top-bottom', 'top-left', 'top-right'].includes(
    compressionDirection
  );
  const showBottom = ['all', 'bottom', 'top-bottom', 'bottom-left', 'bottom-right'].includes(
    compressionDirection
  );
  const showLeft = ['all', 'left', 'left-right', 'top-left', 'bottom-left'].includes(
    compressionDirection
  );
  const showRight = ['all', 'right', 'left-right', 'top-right', 'bottom-right'].includes(
    compressionDirection
  );

  const cellSize = tileSize + gap;
  const totalW = gridCols * cellSize;
  const totalH = gridRows * cellSize;
  const wallW = wallOffset * cellSize;
  const wallH = wallOffset * cellSize;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: totalW,
        height: totalH,
        pointerEvents: 'none',
      }}
      pointerEvents="none"
    >
      {/* Top wall */}
      {showTop && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: wallH,
            backgroundColor: 'rgba(239,68,68,0.08)',
            borderBottomWidth: 2,
            borderBottomColor: 'rgba(239,68,68,0.35)',
          }}
        />
      )}

      {/* Bottom wall */}
      {showBottom && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: wallH,
            backgroundColor: 'rgba(239,68,68,0.08)',
            borderTopWidth: 2,
            borderTopColor: 'rgba(239,68,68,0.35)',
          }}
        />
      )}

      {/* Left wall */}
      {showLeft && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: wallW,
            backgroundColor: 'rgba(239,68,68,0.08)',
            borderRightWidth: 2,
            borderRightColor: 'rgba(239,68,68,0.35)',
          }}
        />
      )}

      {/* Right wall */}
      {showRight && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: wallW,
            backgroundColor: 'rgba(239,68,68,0.08)',
            borderLeftWidth: 2,
            borderLeftColor: 'rgba(239,68,68,0.35)',
          }}
        />
      )}
    </View>
  );
}
