export interface ToggleProps {
  readonly value: boolean;
  readonly onChange: (v: boolean) => void;
  readonly color: string;
}

export function Toggle({ value, onChange, color }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-checked={value}
      role="switch"
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: 'none',
        background: value ? color : '#1a1a2e',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        boxShadow: value ? `0 0 8px ${color}60` : 'none',
        minHeight: 'unset',
        minWidth: 'unset',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: value ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'white',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}
      />
    </button>
  );
}
