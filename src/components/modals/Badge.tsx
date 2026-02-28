export interface BadgeProps {
  readonly label: string;
  readonly color: string;
}

export function Badge({ label, color }: BadgeProps) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.05em',
        color,
        border: `1px solid ${color}40`,
        borderRadius: 4,
        padding: '2px 5px',
        background: `${color}10`,
      }}
    >
      {label}
    </span>
  );
}
