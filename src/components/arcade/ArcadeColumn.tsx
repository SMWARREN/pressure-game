import { CandyMode } from '@/game/modes/candy/index';
import { ShoppingSpreeMode } from '@/game/modes/shoppingSpree/index';
import { GemBlastMode } from '@/game/modes/gemBlast/index';
import { useTheme } from '@/hooks/useTheme';
import { InfoPanel } from './InfoPanel';
import { SampleGrid } from './SampleGrid';
import { ArcadeModeInfo } from '../hubs/HubTypes';

export interface ArcadeModeDef {
  readonly id: string;
  readonly title: string;
  readonly tagline: string;
  readonly symbols: string[];
  readonly accentColor: string;
  readonly mode: typeof CandyMode | typeof ShoppingSpreeMode | typeof GemBlastMode;
  readonly info: ArcadeModeInfo;
}

export interface ArcadeColumnProps {
  readonly def: ArcadeModeDef;
  readonly tileSize: number;
  readonly showInfo: boolean;
  readonly onToggleInfo: (e: React.MouseEvent) => void;
  readonly onPlay: () => void;
  readonly hasDividerRight: boolean;
}

export function ArcadeColumn({
  def,
  tileSize,
  showInfo,
  onToggleInfo,
  onPlay,
  hasDividerRight,
}: ArcadeColumnProps) {
  const { colors } = useTheme();
  // Extract conditional info button styles (S3358: reduce nested ternaries)
  const infoBtnStyles = showInfo
    ? {
        border: `1.5px solid ${def.accentColor}80`,
        background: `${def.accentColor}20`,
        color: def.accentColor,
      }
    : {
        border: `1.5px solid ${colors.border.secondary}`,
        background: colors.bg.tertiary,
        color: colors.text.tertiary,
      };
  const infoBtnIcon = showInfo ? '✕' : 'ℹ';
  const infoBtnLabel = showInfo ? 'Close info' : 'Show info';

  return (
    <button
      style={{
        flex: 1,
        minWidth: 'unset',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '14px 8px',
        cursor: 'pointer',
        position: 'relative',
        background: `${def.accentColor}04`,
        borderRight: hasDividerRight ? `1px solid ${colors.border.secondary}` : 'none',
        transition: 'background 0.15s',
        overflowY: 'auto',
        boxSizing: 'border-box',
        border: 'none',
        minHeight: 'unset',
      }}
      onClick={onPlay}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = `${def.accentColor}10`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = `${def.accentColor}04`;
      }}
    >
      {/* ℹ button */}
      <button
        onClick={onToggleInfo}
        aria-label={infoBtnLabel}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 22,
          height: 22,
          borderRadius: '50%',
          ...infoBtnStyles,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          fontWeight: 900,
          minHeight: 'unset',
          minWidth: 'unset',
          transition: 'all 0.15s',
          zIndex: 2,
        }}
      >
        {infoBtnIcon}
      </button>

      {/* Content */}
      {showInfo ? (
        <InfoPanel info={def.info} accentColor={def.accentColor} />
      ) : (
        <SampleGrid symbols={def.symbols} mode={def.mode} tileSize={tileSize} />
      )}

      {!showInfo && (
        <>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: def.accentColor,
                letterSpacing: '-0.01em',
                marginBottom: 3,
              }}
            >
              {def.title}
            </div>
            <div
              style={{
                fontSize: 9,
                color: colors.text.secondary,
                lineHeight: 1.5,
                whiteSpace: 'pre-line',
              }}
            >
              {def.tagline}
            </div>
          </div>

          <div
            style={{
              padding: '5px 14px',
              borderRadius: 16,
              border: `1.5px solid ${def.accentColor}30`,
              background: `${def.accentColor}12`,
              fontSize: 9,
              fontWeight: 800,
              color: def.accentColor,
              letterSpacing: '0.05em',
            }}
          >
            PLAY
          </div>
        </>
      )}

      {showInfo && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          style={{
            padding: '6px 14px',
            borderRadius: 16,
            border: `1.5px solid ${def.accentColor}40`,
            background: `${def.accentColor}18`,
            fontSize: 9,
            fontWeight: 800,
            color: def.accentColor,
            cursor: 'pointer',
            letterSpacing: '0.05em',
            minHeight: 'unset',
            minWidth: 'unset',
            marginTop: 4,
            flexShrink: 0,
          }}
        >
          PLAY
        </button>
      )}
    </button>
  );
}
