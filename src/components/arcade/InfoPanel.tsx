import { useTheme } from '@/hooks/useTheme';
import { ArcadeModeInfo } from '../hubs/HubTypes';

export interface InfoPanelProps {
  readonly info: ArcadeModeInfo;
  readonly accentColor: string;
}

export function InfoPanel({ info, accentColor }: InfoPanelProps) {
  const { colors } = useTheme();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
        width: '100%',
        animation: 'hubInfoIn 0.18s ease-out both',
      }}
    >
      <div
        style={{
          padding: '6px 8px',
          borderRadius: 8,
          background: `${accentColor}14`,
          border: `1px solid ${accentColor}30`,
          textAlign: 'center',
        }}
      >
        <div
          style={{ fontSize: 11, fontWeight: 900, color: accentColor, letterSpacing: '-0.01em' }}
        >
          {info.scoreFormula}
        </div>
        <div style={{ fontSize: 8, color: colors.text.secondary, marginTop: 2, lineHeight: 1.3 }}>
          {info.scoreNote}
        </div>
      </div>

      {info.mechanics.map((m) => (
        <div key={m.label} style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 11, flexShrink: 0, lineHeight: 1.3 }}>{m.icon}</span>
          <div>
            <div style={{ fontSize: 8, fontWeight: 800, color: colors.text.secondary, marginBottom: 1 }}>
              {m.label}
            </div>
            <div style={{ fontSize: 7.5, color: colors.text.tertiary, lineHeight: 1.35 }}>{m.detail}</div>
          </div>
        </div>
      ))}

      <div
        style={{
          fontSize: 7.5,
          color: colors.text.tertiary,
          borderTop: `1px solid ${colors.border.secondary}`,
          paddingTop: 6,
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {info.worlds}
      </div>
    </div>
  );
}
