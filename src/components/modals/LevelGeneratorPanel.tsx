import { useState } from 'react';
import { Level } from '@/game/types';
import { useGameStore } from '@/game/store';
import { useShallow } from 'zustand/react/shallow';
import { generateLevel, verifyLevel } from '@/game/levels';
import { LoadingSpinner } from '../game/LoadingSpinner';
import { btnPrimary } from '../overlays/Overlay';

export interface LevelGeneratorPanelProps {
  readonly onLoad: (level: Level) => void;
}

export function LevelGeneratorPanel({ onLoad }: LevelGeneratorPanelProps) {
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
  const diff = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 50));
    try {
      const decoys =
        decoysOverride ?? (difficulty === 'easy' ? 2 : difficulty === 'medium' ? 4 : 6);
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
      setResult({
        success: true,
        moves: verification.minMoves ?? undefined,
        message: `Level created! ${verification.minMoves ? `Solvable in ${verification.minMoves} move${verification.minMoves !== 1 ? 's' : ''}` : 'Solvable!'}`,
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
          background: '#07070e',
          borderRadius: 12,
          padding: 4,
          border: '1px solid #12122a',
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
              background: tab === t ? '#14142a' : 'transparent',
              color: tab === t ? '#a5b4fc' : '#3a3a55',
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
              style={{ fontSize: 10, color: '#25253a', letterSpacing: '0.2em', marginBottom: 8 }}
            >
              GRID SIZE: {gridSize}×{gridSize}
            </div>
            <input
              type="range"
              min={4}
              max={10}
              value={gridSize}
              onChange={(e) => setGridSize(+e.target.value)}
              style={{ width: '100%', accentColor: '#6366f1' }}
            />
          </div>
          {/* Node Count */}
          <div>
            <div
              style={{ fontSize: 10, color: '#25253a', letterSpacing: '0.2em', marginBottom: 8 }}
            >
              NODES: {Math.min(nodeCount, maxNodes)}
            </div>
            <input
              type="range"
              min={2}
              max={Math.max(2, maxNodes)}
              value={Math.min(nodeCount, maxNodes)}
              onChange={(e) => setNodeCount(+e.target.value)}
              style={{ width: '100%', accentColor: '#6366f1' }}
            />
          </div>
          {/* Difficulty */}
          <div>
            <div
              style={{ fontSize: 10, color: '#25253a', letterSpacing: '0.2em', marginBottom: 8 }}
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
                    border: `1.5px solid ${difficulty === d ? diff[d] + '60' : '#12122a'}`,
                    background: difficulty === d ? diff[d] + '12' : '#07070e',
                    cursor: 'pointer',
                    color: difficulty === d ? diff[d] : '#3a3a55',
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
                background: result.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${result.success ? '#22c55e40' : '#ef444440'}`,
                color: result.success ? '#22c55e' : '#ef4444',
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
            <div style={{ textAlign: 'center', padding: 32, color: '#25253a', fontSize: 13 }}>
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
                  background: '#07070e',
                  borderRadius: 12,
                  padding: '12px 14px',
                  border: '1px solid #12122a',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>{lvl.name}</div>
                  <div style={{ fontSize: 10, color: '#3a3a55' }}>
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
                      border: '1.5px solid #ef444440',
                      background: 'rgba(239,68,68,0.06)',
                      color: '#ef4444',
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
