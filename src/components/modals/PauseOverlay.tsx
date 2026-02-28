import { btnPrimary, btnSecondary, overlayStyle } from '@/components/overlays/Overlay';

export interface PauseOverlayProps {
  readonly onResume: () => void;
  readonly onMenu: () => void;
}

export function PauseOverlay({ onResume, onMenu }: PauseOverlayProps) {
  return (
    <div style={overlayStyle}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⏸</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#a5b4fc', marginBottom: 8 }}>PAUSED</div>
      <div style={{ fontSize: 10, color: '#3a3a55', marginBottom: 24 }}>
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
