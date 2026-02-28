export interface FeatureInfo {
  icon: string;
  name: string;
  description: string;
}

export interface FeatureInfoSheetProps {
  readonly feature: FeatureInfo | null;
  readonly onClose: () => void;
}

export function FeatureInfoSheet({ feature, onClose }: FeatureInfoSheetProps) {
  if (!feature) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0d0d1a',
          border: '1px solid #2a2a45',
          borderRadius: '16px 16px 0 0',
          padding: '24px 24px 36px',
          width: '100%',
          maxWidth: 440,
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 40, marginBottom: 8 }}>{feature.icon}</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 10 }}>
          {feature.name}
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#9999bb',
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          {feature.description}
        </div>
        <button
          onClick={onClose}
          style={{
            background: '#1e1e35',
            border: '1px solid #3a3a60',
            borderRadius: 8,
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            padding: '10px 32px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
