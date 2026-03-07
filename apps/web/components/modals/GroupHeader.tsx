export interface GroupHeaderProps {
  readonly label: string;
  readonly tagline?: string;
  readonly accentColor: string;
}

export function GroupHeader({ label, tagline, accentColor }: GroupHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        marginTop: 4,
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          width: 3,
          height: 28,
          borderRadius: 2,
          background: accentColor,
          flexShrink: 0,
          boxShadow: `0 0 6px ${accentColor}80`,
        }}
      />
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '0.08em',
            color: accentColor,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
        {tagline && <div style={{ fontSize: 10, color: '#2a2a40', marginTop: 1 }}>{tagline}</div>}
      </div>
    </div>
  );
}
