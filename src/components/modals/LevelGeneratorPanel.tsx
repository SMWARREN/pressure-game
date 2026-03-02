import { useState } from 'react';
import { Level } from '@/game/types';
import { useGameStore } from '@/game/store';
import { useShallow } from 'zustand/react/shallow';
import { generateLevel, verifyLevel } from '@/game/levels';
import { LoadingSpinner } from '../game/LoadingSpinner';
import { btnPrimary } from '../overlays/Overlay';
import { useTheme } from '@/hooks/useTheme';

/**
 * Get decoy count for difficulty level (replaces nested ternary)
 */
function getDecoyCountForDifficulty(difficulty: string): number {
  if (difficulty === 'easy') return 2;
  if (difficulty === 'medium') return 4;
  return 6;
}

export interface LevelGeneratorPanelProps {
  readonly onLoad: (level: Level) => void;
}

export function LevelGeneratorPanel({ onLoad }: LevelGeneratorPanelProps) {
  const { colors } = useTheme();
  const { addGeneratedLevel, generatedLevels, deleteGeneratedLevel } = useGameStore(
    useShallow((s) => ({
      addGeneratedLevel: s.addGeneratedLevel,
      generatedLevels: s.generatedLevels,
      deleteGeneratedLevel: s.deleteGeneratedLevel,
    }))
  );
  const [tab, setTab] = useState<'gen' | 'saved'>('gen');
  const [gridSize, setGridSize] = useState(5);
  const [nodeCount, setNodeCount] = useState(2);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [decoysOverride] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    moves?: number;
    message: string;
  } | null>(null);

  const maxNodes = Math.floor(((gridSize - 2) * (gridSize - 2)) / 2);
  const diff = { easy: colors.status.success, medium: colors.status.warning, hard: colors.status.error };

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 50));
    try {
      const decoys = decoysOverride ?? getDecoyCountForDifficulty(difficulty);
      const level = generateLevel({
        gridSize,
        nodeCount: Math.min(nodeCount, maxNodes),
        difficulty,
        decoys,
      });
      if (!level) {
        setResult({ success: false, message: 'Generation failed — try different settings' });
        setGenerating(false);
        return;
      }
      const verification = verifyLevel(level);
      if (!verification.solvable) {
        setResult({ success: false, message: 'Generated level is not solvable' });
        setGenerating(false);
        return;
      }
      addGeneratedLevel(level);
      const pluralS = verification.minMoves !== 1 ? 's' : '';
      const movesText = verification.minMoves
        ? `Solvable in ${verification.minMoves} move${pluralS}`
        : 'Solvable!';
      const message = `Level created! ${movesText}`;
      setResult({
        success: true,
        moves: verification.minMoves ?? undefined,
        message,
      });
      onLoad(level);
    } catch (e) {
      setResult({
        success: false,
        message: `Error: ${e instanceof Error ? e.message : 'Unknown error'}`,
      });
    }
    setGenerating(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      <div
        style={{
          display: 'flex',
          gap: 6,
          background: colors.bg.tertiary,
          borderRadius: 12,
          padding: 4,
          border: `1px solid ${colors.border.primary}`,
        }}
      >
        {(
          [
            ['gen', 'Generate'],
            ['saved', `Saved (${generatedLevels.length})`],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: tab === t ? colors.bg.secondary : 'transparent',
              color: tab === t ? colors.status.info : colors.text.tertiary,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.04em',
              minHeight: 44,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'gen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Grid Size */}
          <div>
            <div
              style={{ fontSize: 10, color: colors.text.tertiary, letterSpacing: '0.2em', marginBottom: 8 }}
            >
              GRID SIZE: {gridSize}×{gridSize}
            </div>
            <input
              type="range"
              min={4}
              max={10}
              value={gridSize}
              onChange={(e) => setGridSize(+e.target.value)}
              style={{ width: '100%', accentColor: colors.status.info }}
            />
          </div>
          {/* Node Count */}
          <div>
            <div
              style={{ fontSize: 10, color: colors.text.tertiary, letterSpacing: '0.2em', marginBottom: 8 }}
            >
              NODES: {Math.min(nodeCount, maxNodes)}
            </div>
            <input
              type="range"
              min={2}
              max={Math.max(2, maxNodes)}
              value={Math.min(nodeCount, maxNodes)}
              onChange={(e) => setNodeCount(+e.target.value)}
              style={{ width: '100%', accentColor: colors.status.info }}
            />
          </div>
          {/* Difficulty */}
          <div>
            <div
              style={{ fontSize: 10, color: colors.text.tertiary, letterSpacing: '0.2em', marginBottom: 8 }}
            >
              DIFFICULTY
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    borderRadius: 10,
                    border: `1.5px solid ${difficulty === d ? diff[d] + '60' : colors.border.primary}`,
                    background: difficulty === d ? diff[d] + '12' : colors.bg.tertiary,
                    cursor: 'pointer',
                    color: difficulty === d ? diff[d] : colors.text.tertiary,
                    fontSize: 'clamp(10px, 2.8vw, 11px)',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    transition: 'all 0.15s',
                    textTransform: 'uppercase',
                    minHeight: 44,
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          {result && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                textAlign: 'center',
                background: result.success ? `${colors.status.success}12` : `${colors.status.error}12`,
                border: `1px solid ${result.success ? colors.status.success + '40' : colors.status.error + '40'}`,
                color: result.success ? colors.status.success : colors.status.error,
              }}
            >
              {result.message}
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              ...btnPrimary,
              width: '100%',
              opacity: generating ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {generating ? (
              <>
                <LoadingSpinner size={16} color="#fff" />
                <span>GENERATING...</span>
              </>
            ) : (
              <span>⚡ GENERATE LEVEL</span>
            )}
          </button>
        </div>
      )}

      {tab === 'saved' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {generatedLevels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: colors.text.tertiary, fontSize: 13 }}>
              No saved levels yet
            </div>
          ) : (
            generatedLevels.map((lvl) => (
              <div
                key={lvl.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: colors.bg.tertiary,
                  borderRadius: 12,
                  padding: '12px 14px',
                  border: `1px solid ${colors.border.primary}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: colors.text.primary, marginBottom: 2 }}>{lvl.name}</div>
                  <div style={{ fontSize: 10, color: colors.text.tertiary }}>
                    {lvl.gridSize}×{lvl.gridSize} · {lvl.goalNodes.length} goals
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => onLoad(lvl)}
                    style={{ ...btnPrimary, padding: '8px 14px', fontSize: 12 }}
                  >
                    Play
                  </button>
                  <button
                    onClick={() => deleteGeneratedLevel(lvl.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: `1.5px solid ${colors.status.error}40`,
                      background: `${colors.status.error}10`,
                      color: colors.status.error,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      minHeight: 44,
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
