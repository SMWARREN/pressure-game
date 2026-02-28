import { Level } from '@/game/types';

export interface LevelHeaderProps {
  readonly currentLevel: Level;
  readonly levelDisplayNum?: number;
  readonly onMenu: () => void;
  readonly onRestart: () => void;
  readonly iconBtn: React.CSSProperties;
}

export function LevelHeader({
  currentLevel,
  levelDisplayNum,
  onMenu,
  onRestart,
  iconBtn,
}: LevelHeaderProps) {
  return (
    <header
      style={{
        width: '100%',
        flexShrink: 0,
        zIndex: 2,
        position: 'relative',
        borderBottom: '1px solid #12122a',
        background: 'rgba(6,6,15,0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'max(10px, env(safe-area-inset-top)) 12px 10px',
        gap: 8,
      }}
    >
      <button onClick={onMenu} style={iconBtn} title="Menu">
        <span style={{ fontSize: 16 }}>←</span>
      </button>
      <div style={{ textAlign: 'center', flex: 1, minWidth: 0, padding: '0 8px' }}>
        <div
          style={{
            fontSize: 'clamp(14px, 4vw, 18px)',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {currentLevel.name}
        </div>
        <div
          style={{
            fontSize: 'clamp(9px, 2.5vw, 10px)',
            color: '#25253a',
            letterSpacing: '0.15em',
            marginTop: 2,
          }}
        >
          LEVEL {levelDisplayNum || currentLevel.id}
          {currentLevel.isGenerated ? ' · CUSTOM' : ''}
        </div>
      </div>
      <button onClick={onRestart} style={iconBtn} title="Restart">
        <span style={{ fontSize: 16 }}>↺</span>
      </button>
    </header>
  );
}
