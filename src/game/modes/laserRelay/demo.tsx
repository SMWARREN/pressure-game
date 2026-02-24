// PRESSURE - Laser Relay Mode Tutorial Demos

import { TutorialDemoType } from '../types';

const tileBase: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 10,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

export function renderLaserDemo(type: TutorialDemoType, modeColor: string): React.ReactNode | null {
  if (type === 'laser-source') {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#052e16,#065f46)',
            border: '2px solid #22c55e',
            boxShadow: '0 0 14px rgba(34,197,94,0.7)',
          }}
        >
          <span style={{ fontSize: 24, color: '#22c55e' }}>▶</span>
        </div>
        <div
          style={{
            width: 40,
            height: 4,
            background: 'linear-gradient(90deg, #22c55e, #38bdf8)',
            borderRadius: 2,
            boxShadow: '0 0 8px rgba(56,189,248,0.6)',
          }}
        />
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#0f172a,#1e293b)',
            border: '2px solid #475569',
          }}
        >
          <span style={{ fontSize: 24, color: '#475569' }}>╱</span>
        </div>
      </div>
    );
  }

  if (type === 'laser-mirror') {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              ...tileBase,
              background: 'linear-gradient(145deg,#0f172a,#1e293b)',
              border: '2px solid #475569',
            }}
          >
            <span style={{ fontSize: 28, color: '#94a3b8' }}>╱</span>
          </div>
          <div style={{ fontSize: 9, color: '#64748b' }}>FORWARD</div>
        </div>
        <div style={{ fontSize: 20, color: modeColor }}>→</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              ...tileBase,
              background: 'linear-gradient(145deg,#1e3a5f,#0d2137)',
              border: '2px solid #38bdf8',
              boxShadow: '0 0 18px rgba(56,189,248,0.8)',
            }}
          >
            <span style={{ fontSize: 28, color: '#38bdf8' }}>╲</span>
          </div>
          <div style={{ fontSize: 9, color: '#38bdf8' }}>BACKSLASH</div>
        </div>
      </div>
    );
  }

  if (type === 'laser-beam') {
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#052e16,#065f46)',
            border: '2px solid #22c55e',
            boxShadow: '0 0 14px rgba(34,197,94,0.7)',
          }}
        >
          <span style={{ fontSize: 20, color: '#22c55e' }}>▶</span>
        </div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#083344,#0a4254)',
            border: '1px solid #22d3ee',
            boxShadow: '0 0 10px rgba(34,211,238,0.45)',
          }}
        >
          <span style={{ fontSize: 10, color: '#22d3ee' }}>·</span>
        </div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#1e3a5f,#0d2137)',
            border: '2px solid #38bdf8',
            boxShadow: '0 0 18px rgba(56,189,248,0.8)',
          }}
        >
          <span style={{ fontSize: 24, color: '#38bdf8' }}>╱</span>
        </div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#083344,#0a4254)',
            border: '1px solid #22d3ee',
            boxShadow: '0 0 10px rgba(34,211,238,0.45)',
          }}
        >
          <span style={{ fontSize: 10, color: '#22d3ee' }}>·</span>
        </div>
      </div>
    );
  }

  if (type === 'laser-target') {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#1e3a5f,#0d2137)',
            border: '2px solid #38bdf8',
            boxShadow: '0 0 18px rgba(56,189,248,0.8)',
          }}
        >
          <span style={{ fontSize: 24, color: '#38bdf8' }}>╲</span>
        </div>
        <div
          style={{
            width: 40,
            height: 4,
            background: 'linear-gradient(90deg, #38bdf8, #ef4444)',
            borderRadius: 2,
            boxShadow: '0 0 8px rgba(239,68,68,0.6)',
          }}
        />
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#2d0808,#450a0a)',
            border: '2px solid #ef4444',
            boxShadow: '0 0 24px rgba(239,68,68,1), 0 0 8px rgba(239,68,68,0.6)',
          }}
        >
          <span style={{ fontSize: 24, color: '#ef4444' }}>◎</span>
        </div>
      </div>
    );
  }

  if (type === 'laser-ready') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 48, filter: `drop-shadow(0 0 20px ${modeColor}99)` }}>🔦</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#22c55e', '#38bdf8', '#ef4444', '#fbbf24'].map((c, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: c,
                boxShadow: `0 0 8px ${c}`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
