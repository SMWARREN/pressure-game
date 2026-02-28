// PRESSURE - Voltage Mode Tutorial Demos

import { TutorialDemoType } from '../types';
import { tileBase } from '../shared/demoUtils';

export function renderVoltageDemo(
  type: TutorialDemoType,
  modeColor: string
): React.ReactNode | null {
  if (type === 'voltage-cell') {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#0a1a0a,#0f2d0f)',
            border: '2px solid #166534',
            boxShadow: '0 0 8px rgba(22,101,52,0.3)',
          }}
        >
          <span style={{ fontSize: 20, color: '#22c55e' }}>▃</span>
        </div>
        <div style={{ fontSize: 20, color: modeColor }}>→</div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#3d1f00,#3d0a00)',
            border: '2px solid #ef4444',
            boxShadow: '0 0 12px rgba(239,68,68,0.7)',
          }}
        >
          <span style={{ fontSize: 20, color: '#ef4444' }}>▇</span>
        </div>
        <div style={{ fontSize: 20, color: modeColor }}>→</div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#3d0a00,#2d0000)',
            border: '2px solid #ff0000',
            boxShadow: '0 0 18px rgba(255,0,0,0.85)',
          }}
        >
          <span style={{ fontSize: 20, color: '#ff0000' }}>⚡</span>
        </div>
      </div>
    );
  }

  if (type === 'voltage-charge') {
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
        {['▁', '▂', '▃', '▄', '▅', '▆', '▇'].map((bar, i) => {
          const colors = [
            '#14532d',
            '#166534',
            '#22c55e',
            '#eab308',
            '#f97316',
            '#ef4444',
            '#ff0000',
          ];
          return (
            <div
              key={i}
              style={{
                ...tileBase,
                width: 36,
                background: `linear-gradient(145deg, ${colors[i]}20, ${colors[i]}40)`,
                border: `1px solid ${colors[i]}`,
                boxShadow: `0 0 8px ${colors[i]}60`,
              }}
            >
              <span style={{ fontSize: 18, color: colors[i] }}>{bar}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'voltage-discharge') {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <div
              style={{
                ...tileBase,
                width: 40,
                background: 'linear-gradient(145deg,#3d1f00,#3d0a00)',
                border: '2px solid #ef4444',
                boxShadow: '0 0 10px rgba(239,68,68,0.6)',
              }}
            >
              <span style={{ fontSize: 16, color: '#ef4444' }}>▅</span>
            </div>
            <div
              style={{
                ...tileBase,
                width: 40,
                background: 'linear-gradient(145deg,#3d3d00,#3d2d00)',
                border: '2px solid #eab308',
                boxShadow: '0 0 10px rgba(234,179,8,0.6)',
              }}
            >
              <span style={{ fontSize: 16, color: '#eab308' }}>▄</span>
            </div>
          </div>
          <div style={{ fontSize: 9, color: '#64748b' }}>CHARGED</div>
        </div>
        <div style={{ fontSize: 24, color: modeColor }}>👆</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <div
              style={{
                ...tileBase,
                width: 40,
                background: 'rgba(10,10,20,0.25)',
                border: '1px solid #1e293b',
              }}
            >
              <span style={{ fontSize: 16, color: '#1e293b' }}></span>
            </div>
            <div
              style={{
                ...tileBase,
                width: 40,
                background: 'rgba(10,10,20,0.25)',
                border: '1px solid #1e293b',
              }}
            >
              <span style={{ fontSize: 16, color: '#1e293b' }}></span>
            </div>
          </div>
          <div style={{ fontSize: 9, color: '#22c55e' }}>+9 PTS!</div>
        </div>
      </div>
    );
  }

  if (type === 'voltage-hotcold') {
    return (
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              ...tileBase,
              background: 'linear-gradient(145deg,#3d1f00,#2d0a00)',
              border: '2px solid #f97316',
              boxShadow: '0 0 12px rgba(249,115,22,0.6), 0 0 6px rgba(251,191,36,0.4)',
            }}
          >
            <span style={{ fontSize: 20 }}>🔥</span>
          </div>
          <div style={{ fontSize: 9, color: '#f97316' }}>HOT 2×</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              ...tileBase,
              background: 'linear-gradient(145deg,#0c1a2e,#0f2040)',
              border: '2px solid #1d4ed8',
              boxShadow: '0 0 8px rgba(29,78,216,0.3)',
            }}
          >
            <span style={{ fontSize: 20 }}>❄️</span>
          </div>
          <div style={{ fontSize: 9, color: '#1d4ed8' }}>COLD 0.5×</div>
        </div>
      </div>
    );
  }

  if (type === 'voltage-ready') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 48, filter: `drop-shadow(0 0 20px ${modeColor}99)` }}>⚡</div>
        <div
          style={{
            padding: '6px 12px',
            background: 'rgba(239,68,68,0.2)',
            border: '1px solid #ef4444',
            borderRadius: 8,
            fontSize: 11,
            color: '#ef4444',
          }}
        >
          ⚠️ OVERLOAD = GAME OVER
        </div>
      </div>
    );
  }

  return null;
}
