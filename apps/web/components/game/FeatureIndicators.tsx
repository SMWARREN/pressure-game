import { Level, Tile } from '@/game/types';

interface FeatureInfo {
  icon: string;
  name: string;
  description: string;
}

const FEATURE_INFO: Record<string, FeatureInfo> = {
  wildcards: { icon: '⭐', name: 'Wildcards', description: 'Match with any tile color' },
  bombs: { icon: '💣', name: 'Bombs', description: 'Explode in a 3×3 radius' },
  comboChain: {
    icon: '🔥',
    name: 'Combo Chain',
    description: 'Build multipliers on consecutive matches',
  },
  rain: { icon: '🌧️', name: 'Rain', description: 'Randomly shuffles tiles over time' },
  ice: { icon: '🧊', name: 'Ice', description: 'Blocks freeze and block connections' },
  thieves: { icon: '🦹', name: 'Thieves', description: 'Steal tiles and change their color' },
};

const FEATURES: Array<[string, string]> = [
  ['wildcards', '#fbbf24'],
  ['bombs', '#ef4444'],
  ['comboChain', '#f97316'],
  ['rain', '#60a5fa'],
  ['ice', '#93c5fd'],
  ['thieves', '#f87171'],
];

function getFeatureCount(
  key: string,
  tiles: Tile[],
  modeState?: Record<string, unknown>
): number | null {
  switch (key) {
    case 'wildcards':
      return (
        tiles.filter((t) => t.displayData?.isWildcard || t.displayData?.symbol === '⭐').length ||
        null
      );
    case 'bombs':
      return (
        tiles.filter((t) => t.displayData?.isBomb || t.displayData?.symbol === '💣').length || null
      );
    case 'ice':
      return tiles.filter((t) => t.displayData?.frozen).length || null;
    case 'thieves':
      return tiles.filter((t) => t.displayData?.hasThief).length || null;
    case 'comboChain': {
      const multiplier = (modeState?.combo as any)?.multiplier;
      return multiplier && multiplier > 1 ? multiplier : null;
    }
    default:
      return null;
  }
}

export interface FeatureIndicatorsProps {
  readonly currentLevel: Level;
  readonly onShowFeatureInfo: (feature: FeatureInfo) => void;
  readonly tiles?: Tile[];
  readonly modeState?: Record<string, unknown>;
}

export function FeatureIndicators({
  currentLevel,
  onShowFeatureInfo,
  tiles = [],
  modeState,
}: FeatureIndicatorsProps) {
  const hasFeatures = currentLevel.features && Object.values(currentLevel.features).includes(true);

  if (!hasFeatures) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        padding: '4px 12px',
        flexShrink: 0,
      }}
    >
      {FEATURES.map(
        ([key, color]) =>
          currentLevel.features?.[key as keyof typeof currentLevel.features] && (
            <button
              key={key}
              onClick={() => onShowFeatureInfo(FEATURE_INFO[key])}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color,
                background: `${color}12`,
                borderRadius: 6,
                padding: '2px 8px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {FEATURE_INFO[key].icon} {FEATURE_INFO[key].name}
              {(() => {
                const count = getFeatureCount(key, tiles, modeState);
                if (count === null) return null;
                const label =
                  key === 'comboChain' ? `x${(count as number).toFixed(1)}` : String(count);
                return (
                  <span
                    style={{
                      background: color,
                      color: '#000',
                      borderRadius: 4,
                      padding: '0 4px',
                      fontSize: 10,
                      fontWeight: 800,
                      marginLeft: 2,
                    }}
                  >
                    {label}
                  </span>
                );
              })()}
            </button>
          )
      )}
    </div>
  );
}
