import React, { memo, useCallback } from 'react';
import { Pressable, View, Text, Image } from 'react-native';
import type { Tile } from '@/game/types';
import type { TileRenderer } from '@/game/modes/types';
import { SYMBOL_IMAGES } from '../assets/symbolImages';

interface GameTileProps {
  readonly tile?: Tile;
  readonly size: number;
  readonly gap: number;
  readonly compressionActive: boolean;
  readonly isConnected: boolean;
  readonly inDanger: boolean;
  readonly onTap: () => void;
  readonly tileRenderer?: TileRenderer;
}

// Background colors matching web gradients (approximated for RN)
function getTileBackground(tile: Tile, inDanger: boolean): string {
  if (tile.type === 'wall') return '#0e0e1c';
  if (tile.type === 'crushed') return '#2d0606';
  if (tile.type === 'node') {
    return inDanger ? '#3d0808' : '#0f2d1a';
  }
  if (tile.type === 'path') {
    if (tile.isDecoy) return '#0d1830';
    if (tile.canRotate) return '#3a1a05';
    return '#0d1830';
  }
  return '#0a0a14';
}

// Border color matching web
function getTileBorderColor(tile: Tile, isConnected: boolean, inDanger: boolean): string {
  if (tile.type === 'wall') return '#131325';
  if (tile.type === 'crushed') return '#ef4444';
  if (tile.type === 'node') {
    if (inDanger) return '#ef4444';
    return isConnected ? '#22c55e' : '#166534';
  }
  if (tile.type === 'path') {
    if (inDanger) return '#ef4444';
    if (tile.isDecoy) return '#3b82f6';
    if (tile.canRotate) return '#f59e0b';
    return '#2a4080';
  }
  return '#1a1a35';
}

// Pipe/connection color matching web
function getPipeColor(tile: Tile, inDanger: boolean): string {
  if (tile.type === 'node') {
    return inDanger ? 'rgba(252,165,165,0.9)' : 'rgba(134,239,172,0.95)';
  }
  if (tile.isDecoy) return 'rgba(147,197,253,0.85)';
  if (tile.canRotate) {
    return inDanger ? 'rgba(252,165,165,0.9)' : 'rgba(252,211,77,0.92)';
  }
  return 'rgba(147,197,253,0.85)';
}

function PipeSegments({ tile, size, color }: { tile: Tile; size: number; color: string }) {
  const thickness = Math.max(3, size * 0.18);
  const half = size / 2;
  const segments: React.ReactElement[] = [];

  if (tile.connections.includes('up')) {
    segments.push(
      <View
        key="up"
        style={{
          position: 'absolute',
          left: half - thickness / 2,
          top: 0,
          width: thickness,
          height: half + thickness / 2,
          backgroundColor: color,
          borderRadius: thickness / 2,
        }}
      />
    );
  }
  if (tile.connections.includes('down')) {
    segments.push(
      <View
        key="down"
        style={{
          position: 'absolute',
          left: half - thickness / 2,
          top: half - thickness / 2,
          width: thickness,
          height: half + thickness / 2,
          backgroundColor: color,
          borderRadius: thickness / 2,
        }}
      />
    );
  }
  if (tile.connections.includes('left')) {
    segments.push(
      <View
        key="left"
        style={{
          position: 'absolute',
          top: half - thickness / 2,
          left: 0,
          width: half + thickness / 2,
          height: thickness,
          backgroundColor: color,
          borderRadius: thickness / 2,
        }}
      />
    );
  }
  if (tile.connections.includes('right')) {
    segments.push(
      <View
        key="right"
        style={{
          position: 'absolute',
          top: half - thickness / 2,
          left: half - thickness / 2,
          width: half + thickness / 2,
          height: thickness,
          backgroundColor: color,
          borderRadius: thickness / 2,
        }}
      />
    );
  }

  // Center dot
  if (tile.connections.length > 0) {
    const dotSize = thickness * 1.4;
    segments.push(
      <View
        key="center"
        style={{
          position: 'absolute',
          left: half - dotSize / 2,
          top: half - dotSize / 2,
          width: dotSize,
          height: dotSize,
          backgroundColor: color,
          borderRadius: dotSize / 2,
        }}
      />
    );
  }

  return <>{segments}</>;
}

/** Parse a CSS background string into a React Native color string. */
function parseCssBgColor(rawBg: string): string {
  let bgColorStr = '#1a1a2e';
  if (rawBg.startsWith('linear-gradient')) {
    const m = rawBg.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/);
    bgColorStr = m ? m[1] : '#1a1a2e';
  } else if (rawBg.startsWith('#') || rawBg.startsWith('rgb')) {
    bgColorStr = rawBg;
  }
  if (rawBg.includes('rgba(') && rawBg.includes(', 0)')) {
    bgColorStr = 'transparent';
  }
  return bgColorStr;
}

interface CustomTileProps {
  tile: Tile;
  size: number;
  gap: number;
  inDanger: boolean;
  compressionActive: boolean;
  tileRenderer: TileRenderer;
  handlePress: () => void;
}

/** Render a tile using the mode's custom tileRenderer (e.g. Candy, Shopping Spree). */
function CustomTile({ tile, size, gap, inDanger, compressionActive, tileRenderer, handlePress }: CustomTileProps) {
  const ctx = {
    isHint: false,
    inDanger,
    justRotated: false,
    compressionActive: compressionActive ?? false,
    tileSize: size,
    theme: 'dark' as const,
  };
  const customColors = tileRenderer.getColors?.(tile, ctx);
  const symbol = tileRenderer.getSymbol?.(tile, ctx);

  const rawBg = customColors?.background ?? '';
  const bgColorStr = parseCssBgColor(rawBg);

  const rawBorder = customColors?.border ?? '';
  const borderParts = rawBorder.split(' ');
  const borderColorStr =
    borderParts.find((s) => s.startsWith('#') || s.startsWith('rgb')) ?? 'transparent';

  const r = size * 0.12;
  const symbolFontSize = Math.max(10, size * 0.52);
  return (
    <Pressable
      onPress={handlePress}
      disabled={!tile.canRotate && !tile.isGoalNode}
      style={{
        width: size,
        height: size,
        marginRight: gap,
        marginBottom: gap,
        backgroundColor: bgColorStr,
        borderColor: borderColorStr,
        borderWidth: borderColorStr === 'transparent' ? 0 : 1.5,
        borderRadius: r,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {symbol && (
        SYMBOL_IMAGES[symbol]
          ? <Image source={SYMBOL_IMAGES[symbol]} style={{ width: symbolFontSize, height: symbolFontSize }} />
          : <Text style={{ fontSize: symbolFontSize, textAlign: 'center' }}>{symbol}</Text>
      )}
    </Pressable>
  );
}

interface StandardTileProps {
  tile: Tile;
  size: number;
  gap: number;
  isConnected: boolean;
  inDanger: boolean;
  handlePress: () => void;
}

/** Render a standard pipe/node/crushed tile. */
function StandardTile({ tile, size, gap, isConnected, inDanger, handlePress }: StandardTileProps) {
  const bgColor = getTileBackground(tile, inDanger);
  const borderColor = getTileBorderColor(tile, isConnected, inDanger);
  const borderWidth = tile.type === 'node' || tile.canRotate || inDanger ? 2 : 1.5;
  const pipeColor = getPipeColor(tile, inDanger);
  const r = size * 0.12;

  if (tile.type === 'crushed') {
    return (
      <View
        style={{
          width: size,
          height: size,
          marginRight: gap,
          marginBottom: gap,
          backgroundColor: bgColor,
          borderColor,
          borderWidth: 2,
          borderRadius: r,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: Math.max(8, size * 0.3), color: '#ef4444', fontWeight: '900' }}>
          ✕
        </Text>
      </View>
    );
  }

  const indicatorSize = Math.max(4, size * 0.12);

  return (
    <Pressable
      onPress={handlePress}
      disabled={!tile.canRotate && !tile.isGoalNode}
      style={{
        width: size,
        height: size,
        marginRight: gap,
        marginBottom: gap,
        backgroundColor: bgColor,
        borderColor,
        borderWidth,
        borderRadius: r,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {tile.connections.length > 0 && <PipeSegments tile={tile} size={size} color={pipeColor} />}

      {tile.type === 'node' && (
        <View
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: -(size * 0.2),
            marginLeft: -(size * 0.2),
            width: size * 0.4,
            height: size * 0.4,
            borderRadius: size * 0.2,
            borderWidth: 2,
            borderColor: inDanger ? 'rgba(252,165,165,0.5)' : 'rgba(134,239,172,0.5)',
          }}
        />
      )}

      {tile.canRotate && !tile.isDecoy && (
        <View
          style={{
            position: 'absolute',
            top: 3,
            right: 3,
            width: indicatorSize,
            height: indicatorSize,
            borderRadius: indicatorSize / 2,
            backgroundColor: inDanger ? '#fca5a5' : '#fcd34d',
          }}
        />
      )}
    </Pressable>
  );
}

function GameTileComponent({
  tile,
  size,
  gap,
  onTap,
  isConnected,
  inDanger,
  compressionActive,
  tileRenderer,
}: GameTileProps) {
  const handlePress = useCallback(() => onTap(), [onTap]);

  if (!tile) {
    return (
      <View
        style={{
          width: size,
          height: size,
          marginRight: gap,
          marginBottom: gap,
          backgroundColor: '#0a0a14',
          borderColor: '#1a1a35',
          borderWidth: 1,
          borderRadius: size * 0.12,
        }}
      />
    );
  }

  if (tile.type === 'wall') {
    return (
      <View
        style={{
          width: size,
          height: size,
          marginRight: gap,
          marginBottom: gap,
          backgroundColor: '#0e0e1c',
          borderColor: '#131325',
          borderWidth: 1,
          borderRadius: size * 0.12,
        }}
      />
    );
  }

  if (tileRenderer?.hidePipes && tile.type !== 'crushed') {
    return (
      <CustomTile
        tile={tile}
        size={size}
        gap={gap}
        inDanger={inDanger}
        compressionActive={compressionActive}
        tileRenderer={tileRenderer}
        handlePress={handlePress}
      />
    );
  }

  return (
    <StandardTile
      tile={tile}
      size={size}
      gap={gap}
      isConnected={isConnected}
      inDanger={inDanger}
      handlePress={handlePress}
    />
  );
}

export default memo(GameTileComponent);
