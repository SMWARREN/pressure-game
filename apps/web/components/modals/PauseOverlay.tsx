import { btnPrimary, btnSecondary, getOverlayStyle } from '@/components/overlays/Overlay';
import { useTheme } from '@/hooks/useTheme';

export interface PauseOverlayProps {
  readonly onResume: () => void;
  readonly onMenu: () => void;
}

export function PauseOverlay({ onResume, onMenu }: PauseOverlayProps) {
  const { colors } = useTheme();

  return (
    <div style={getOverlayStyle(colors)}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⏸</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: colors.status.info, marginBottom: 8 }}>
        PAUSED
      </div>
      <div style={{ fontSize: 10, color: colors.text.tertiary, marginBottom: 24 }}>
        Take a break — your game is waiting
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={onResume} style={btnPrimary}>
          ▶ RESUME
        </button>
        <button onClick={onMenu} style={btnSecondary}>
          MENU
        </button>
      </div>
    </div>
  );
}
