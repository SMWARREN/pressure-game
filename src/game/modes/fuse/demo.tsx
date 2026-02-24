// PRESSURE - Fuse Mode Tutorial Demos

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

export function renderFuseDemo(type: TutorialDemoType, modeColor: string): React.ReactNode | null {
  if (type === 'fuse-plant') {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              ...tileBase,
              background: 'rgba(15,15,25,0.4)',
              border: '1px solid #1e293b',
            }}
          >
            <span style={{ fontSize: 20, color: '#1e293b' }}></span>
          </div>
          <div style={{ fontSize: 9, color: '#64748b' }}>EMPTY</div>
        </div>
        <div style={{ fontSize: 20, color: modeColor }}>→</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              ...tileBase,
              background: 'linear-gradient(145deg,#2d0a00,#3d0f00)',
              border: '2px solid #ef4444',
              boxShadow: '0 0 10px rgba(239,68,68,0.55)',
            }}
          >
            <span style={{ fontSize: 24 }}>💣</span>
          </div>
          <div style={{ fontSize: 9, color: '#ef4444' }}>ARMED</div>
        </div>
      </div>
    );
  }

  if (type === 'fuse-chain') {
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#1c1f00,#2d2f00)',
            border: '2px solid #facc15',
            boxShadow: '0 0 14px rgba(250,204,21,0.6)',
          }}
        >
          <span style={{ fontSize: 22 }}>⚡</span>
        </div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#3d1f00,#2d1500)',
            border: '2px solid #fb923c',
            boxShadow: '0 0 20px rgba(251,146,60,0.8)',
          }}
        >
          <span style={{ fontSize: 22 }}>💥</span>
        </div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#2d0a00,#3d0f00)',
            border: '2px solid #ef4444',
            boxShadow: '0 0 10px rgba(239,68,68,0.55)',
          }}
        >
          <span style={{ fontSize: 22 }}>💣</span>
        </div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#2d0a00,#3d0f00)',
            border: '2px solid #ef4444',
            boxShadow: '0 0 10px rgba(239,68,68,0.55)',
          }}
        >
          <span style={{ fontSize: 22 }}>💣</span>
        </div>
      </div>
    );
  }

  if (type === 'fuse-relay') {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#3d1f00,#2d1500)',
            border: '2px solid #fb923c',
            boxShadow: '0 0 20px rgba(251,146,60,0.8)',
          }}
        >
          <span style={{ fontSize: 22 }}>💥</span>
        </div>
        <div
          style={{
            width: 30,
            height: 4,
            background: 'linear-gradient(90deg, #fb923c, #60a5fa)',
            borderRadius: 2,
            boxShadow: '0 0 8px rgba(251,146,60,0.6)',
          }}
        />
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#0f1f3d,#0a1529)',
            border: '2px solid #60a5fa',
            boxShadow: '0 0 12px rgba(96,165,250,0.5)',
          }}
        >
          <span style={{ fontSize: 22 }}>🎯</span>
        </div>
      </div>
    );
  }

  if (type === 'fuse-detonate') {
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#3d1f00,#2d1500)',
            border: '2px solid #fb923c',
            boxShadow: '0 0 20px rgba(251,146,60,0.8)',
          }}
        >
          <span style={{ fontSize: 20 }}>💥</span>
        </div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#3d1f00,#2d1500)',
            border: '2px solid #fb923c',
            boxShadow: '0 0 20px rgba(251,146,60,0.8)',
          }}
        >
          <span style={{ fontSize: 20 }}>💥</span>
        </div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg,#2d0a00,#3d0f00)',
            border: '2px solid #ef4444',
            boxShadow: '0 0 10px rgba(239,68,68,0.55)',
          }}
        >
          <span style={{ fontSize: 20 }}>💣</span>
        </div>
        <div
          style={{
            ...tileBase,
            background: '#111118',
            border: '2px solid #374151',
          }}
        >
          <span style={{ fontSize: 20 }}>◼</span>
        </div>
        <div
          style={{
            ...tileBase,
            background: 'rgba(15,15,25,0.4)',
            border: '1px solid #1e293b',
          }}
        >
          <span style={{ fontSize: 20, color: '#64748b' }}>💣</span>
        </div>
      </div>
    );
  }

  if (type === 'fuse-ready') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 48, filter: `drop-shadow(0 0 20px ${modeColor}99)` }}>💣</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#facc15', '#ef4444', '#60a5fa', '#fb923c'].map((c, i) => (
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
