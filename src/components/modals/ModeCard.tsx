import { GameModeConfig } from '@/game/types';
import { Badge } from './Badge';

export interface ModeCardProps {
  readonly mode: GameModeConfig;
  readonly active: boolean;
  readonly isNew: boolean;
  readonly onSelect: () => void;
}

export function ModeCard({ mode, active, isNew, onSelect }: ModeCardProps) {
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 14,
        border: `1.5px solid ${active ? mode.color + '70' : '#12122a'}`,
        background: active ? `${mode.color}14` : '#07070e',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s',
        width: '100%',
        position: 'relative',
        boxShadow: active ? `0 0 20px ${mode.color}12` : 'none',
      }}
    >
      {/* "NEW" badge for unseen modes */}
      {isNew && (
        <div
          style={{
            position: 'absolute',
            top: -6,
            right: 12,
            fontSize: 8,
            fontWeight: 900,
            letterSpacing: '0.1em',
            color: '#fff',
            background: '#6366f1',
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          NEW
        </div>
      )}

      <span
        style={{
          fontSize: 26,
          filter: active ? `drop-shadow(0 0 10px ${mode.color}90)` : 'grayscale(0.6) opacity(0.5)',
          transition: 'filter 0.2s',
          flexShrink: 0,
        }}
      >
        {mode.icon}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: active ? mode.color : '#2a2a3e',
            transition: 'color 0.2s',
            marginBottom: 3,
          }}
        >
          {mode.name}
        </div>
        <div style={{ fontSize: 11, color: '#25253a', lineHeight: 1.4 }}>{mode.description}</div>
      </div>

      {/* Feature badges */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          alignItems: 'flex-end',
          flexShrink: 0,
        }}
      >
        {mode.supportsUndo === false && <Badge label="No Undo" color="#ef4444" />}
        {mode.wallCompression === 'never' && <Badge label="No Walls" color="#34d399" />}
        {mode.wallCompression === 'always' && <Badge label="Walls On" color="#f97316" />}
        {mode.useMoveLimit === false && <Badge label="Unlimited" color="#60a5fa" />}
        {active && <Badge label="Active" color={mode.color} />}
      </div>
    </button>
  );
}
