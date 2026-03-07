import { GameModeConfig } from '@/game/modes/types';

interface NotificationLogEntry {
  id: number;
  text: string;
  isScore: boolean;
}

export interface NotificationLogProps {
  readonly notifLog: NotificationLogEntry[];
  readonly mode: GameModeConfig;
  readonly viewportWidth: number;
  readonly boardMaxWidth?: number;
}

export function NotificationLog({
  notifLog,
  mode,
  viewportWidth,
  boardMaxWidth = 238,
}: NotificationLogProps) {
  // Only show on wider screens and when there are entries
  if (viewportWidth < 560 || notifLog.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `calc(50% + ${Math.min(viewportWidth * 0.485, boardMaxWidth)}px)`,
        top: '50%',
        transform: 'translateY(-50%)',
        width: Math.min(
          viewportWidth - Math.min(viewportWidth * 0.485, boardMaxWidth) * 2 - 16,
          320
        ),
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {notifLog
        .slice()
        .reverse()
        .map((entry, i) => {
          const opacity = Math.max(0.15, 1 - i * 0.1);
          const color = entry.isScore ? mode.color : '#fbbf24';
          return (
            <div
              key={entry.id}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color,
                opacity,
                letterSpacing: '0.03em',
                lineHeight: 1.4,
                textShadow: `0 0 10px ${color}60`,
                padding: '4px 10px',
                background: 'rgba(0,0,0,0.55)',
                borderRadius: 6,
                borderLeft: `3px solid ${color}`,
              }}
            >
              {entry.text}
            </div>
          );
        })}
    </div>
  );
}
