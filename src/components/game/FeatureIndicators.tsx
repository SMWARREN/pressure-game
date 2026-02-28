import { Level } from '@/game/types';

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

export interface FeatureIndicatorsProps {
  readonly currentLevel: Level;
  readonly onShowFeatureInfo: (feature: FeatureInfo) => void;
}

export function FeatureIndicators({ currentLevel, onShowFeatureInfo }: FeatureIndicatorsProps) {
  const hasFeatures =
    currentLevel.features && Object.values(currentLevel.features).some((v) => v === true);

  if (!hasFeatures) return null;

  const FEATURES: Array<[string, string]> = [
    ['wildcards', '#fbbf24'],
    ['bombs', '#ef4444'],
    ['comboChain', '#f97316'],
    ['rain', '#60a5fa'],
    ['ice', '#93c5fd'],
    ['thieves', '#f87171'],
  ];

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
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {FEATURE_INFO[key].icon} {FEATURE_INFO[key].name}
            </button>
          )
      )}
    </div>
  );
}
