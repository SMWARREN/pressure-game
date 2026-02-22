import React from 'react';

const iconBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #12122a',
  background: 'rgba(255,255,255,0.02)',
  color: '#3a3a55',
  transition: 'all 0.15s',
  flexShrink: 0,
};

interface GameControlsProps {
  onUndo: () => void;
  undoDisabled: boolean;
  timeStr: string;
  showHint: boolean;
  onToggleHint: () => void;
}

/**
 * GameControls - Bottom controls (undo, time display, hint button)
 */
export default function GameControls({
  onUndo,
  undoDisabled,
  timeStr,
  showHint,
  onToggleHint,
}: GameControlsProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 16,
        position: 'relative',
        zIndex: 1,
      }}>
      {/* Undo button */}
      <button
        onClick={onUndo}
        disabled={undoDisabled}
        style={{
          ...iconBtn,
          opacity: undoDisabled ? 0.3 : 1,
        }}
        title="Undo">
        <span style={{ fontSize: 16 }}>⎌</span>
      </button>

      {/* Time display */}
      <div
        style={{
          padding: '8px 16px',
          borderRadius: 10,
          background: '#07070e',
          border: '1px solid #12122a',
          fontSize: 14,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: '#3a3a55',
          minWidth: 60,
          textAlign: 'center',
        }}>
        {timeStr || '--:--'}
      </div>

      {/* Hint button */}
      <button
        onClick={onToggleHint}
        style={{
          ...iconBtn,
          border: showHint ? '1px solid #f59e0b50' : '1px solid #12122a',
          background: showHint ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.02)',
          color: showHint ? '#fbbf24' : '#3a3a55',
        }}
        title="Hint">
        <span style={{ fontSize: 16 }}>💡</span>
      </button>
    </div>
  );
}
