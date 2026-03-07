import React, { memo, useCallback } from 'react';
import { Pressable, View, Text } from 'react-native';
import { Tile } from '@/game/types';

interface GameTileProps {
  readonly tile: Tile;
  readonly size: number;
  readonly gap: number;
  readonly wallOffset: number;
  readonly wallsJustAdvanced: boolean;
  readonly compressionActive: boolean;
  readonly onTap: () => void;
}

/**
 * GameTile (Mobile/React Native)
 * Renders a single tile with connections, pipes, and walls
 * Handles touch interaction
 */
function GameTileComponent({
  tile,
  size,
  gap,
  wallOffset,
  wallsJustAdvanced,
  compressionActive,
  onTap,
}: GameTileProps) {
  const handlePress = useCallback(() => {
    onTap();
  }, [onTap]);

  // Get tile colors based on tile type
  const getTileColor = () => {
    if (tile.isGoalNode) return '#ef4444';
    if (tile.isDecoy) return '#9ca3af';
    return '#1f2937';
  };

  // Get border color based on connection status
  const getBorderColor = () => {
    return tile.connections.length > 0 ? '#3b82f6' : '#4b5563';
  };

  const tileStyle = {
    width: size,
    height: size,
    marginRight: gap,
    marginBottom: gap,
    backgroundColor: getTileColor(),
    borderColor: getBorderColor(),
    borderWidth: 2,
    borderRadius: size * 0.1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  };

  // Display value for some game modes
  const displayValue = tile.displayData?.value;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        tileStyle,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        {displayValue && (
          <Text style={styles.tileText}>{displayValue}</Text>
        )}
      </View>

      {/* Goal node glow */}
      {tile.isGoalNode && (
        <View style={styles.goalGlow} />
      )}
    </Pressable>
  );
}

const styles = {
  pressed: {
    opacity: 0.8,
  },
  content: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  tileText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  wallIndicator: {
    position: 'absolute' as const,
    bottom: 2,
    right: 2,
    width: 4,
    height: 4,
    backgroundColor: '#000',
    borderRadius: 2,
  },
  goalGlow: {
    position: 'absolute' as const,
    top: 2,
    left: 2,
    width: 4,
    height: 4,
    backgroundColor: '#fbbf24',
    borderRadius: 2,
  },
};

export default memo(GameTileComponent);
