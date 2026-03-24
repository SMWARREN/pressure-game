import React from 'react';
import { View, Text, Image } from 'react-native';
import type { Tile } from '@/game/types';
import { styles } from './GameBoardStyles.native';

export const FEATURE_LIST = [
  { key: 'wildcards',  img: require('../assets/tile-star.png'),   label: 'Wildcards', color: '#fbbf24' },
  { key: 'bombs',      img: require('../assets/emoji-fuse.png'),  label: 'Bombs',     color: '#ef4444' },
  { key: 'comboChain', img: require('../assets/tile-fire.png'),   label: 'Combo',     color: '#f97316' },
  { key: 'rain',       img: require('../assets/tile-rain.png'),   label: 'Rain',      color: '#60a5fa' },
  { key: 'ice',        img: require('../assets/tile-ice.png'),    label: 'Ice',       color: '#93c5fd' },
  { key: 'thieves',    img: require('../assets/tile-thief.png'),  label: 'Thieves',   color: '#f87171' },
];

function getWildcardCount(tiles: Tile[]): string | null {
  const n = tiles.filter((t) => t.displayData?.isWildcard || t.displayData?.symbol === '⭐').length;
  return n > 0 ? String(n) : null;
}

function getBombCount(tiles: Tile[]): string | null {
  const n = tiles.filter((t) => t.displayData?.isBomb || t.displayData?.symbol === '💣').length;
  return n > 0 ? String(n) : null;
}

function getIceCount(tiles: Tile[]): string | null {
  const n = tiles.filter((t) => t.displayData?.frozen).length;
  return n > 0 ? String(n) : null;
}

function getThiefCount(tiles: Tile[]): string | null {
  const n = tiles.filter((t) => t.displayData?.hasThief).length;
  return n > 0 ? String(n) : null;
}

function getComboCount(modeState: Record<string, unknown> | null | undefined): string | null {
  const combo = modeState?.combo as { multiplier?: number } | undefined;
  const multiplier = combo?.multiplier;
  return multiplier && multiplier > 1 ? `x${multiplier.toFixed(1)}` : null;
}

export function getFeatureCount(
  key: string,
  tiles: Tile[],
  modeState: Record<string, unknown> | null | undefined
): string | null {
  if (key === 'wildcards') return getWildcardCount(tiles);
  if (key === 'bombs') return getBombCount(tiles);
  if (key === 'ice') return getIceCount(tiles);
  if (key === 'thieves') return getThiefCount(tiles);
  if (key === 'comboChain') return getComboCount(modeState);
  return null;
}

interface FeatureIndicatorsProps {
  features: Record<string, unknown> | null | undefined;
  tiles: Tile[];
  modeState: Record<string, unknown> | null | undefined;
}

export default function FeatureIndicators({ features, tiles, modeState }: FeatureIndicatorsProps) {
  if (!features) return null;
  const active = FEATURE_LIST.filter((f) => features[f.key] === true);
  if (active.length === 0) return null;
  return (
    <View style={styles.featureRow}>
      {active.map((f) => {
        const count = getFeatureCount(f.key, tiles, modeState);
        return (
          <View key={f.key} style={[styles.featureBadge, { backgroundColor: `${f.color}12` }]}>
            <Image source={f.img} style={styles.featureIcon} />
            <Text style={[styles.featureLabel, { color: f.color }]}>{f.label}</Text>
            {count !== null && (
              <View style={[styles.featureCount, { backgroundColor: f.color }]}>
                <Text style={styles.featureCountText}>{count}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
