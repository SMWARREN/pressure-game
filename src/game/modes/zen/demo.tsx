// PRESSURE - Zen Mode Tutorial Demos

import { TutorialDemoType } from '../types';
import { tileBase, pipe, dot, rotateDot } from '../shared/demoUtils';

export function renderZenDemo(type: TutorialDemoType, modeColor: string): React.ReactNode | null {
  if (type === 'fixed-path') {
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg, #14532d, #0f3d21)',
            border: '2px solid #22c55e',
            boxShadow: '0 0 14px rgba(34,197,94,0.3)',
          }}
        >
          {pipe('right', 'rgba(134,239,172,0.9)')}
          {pipe('down', 'rgba(134,239,172,0.9)')}
          {dot('rgba(134,239,172,0.9)')}
        </div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg, #78350f, #5c2a0a)',
            border: '2px solid #f59e0b',
            boxShadow: '0 0 8px rgba(245,158,11,0.2)',
          }}
        >
          {pipe('left', 'rgba(252,211,77,0.9)')}
          {pipe('right', 'rgba(252,211,77,0.9)')}
          {dot('rgba(252,211,77,0.9)')}
          {rotateDot}
        </div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg, #14532d, #0f3d21)',
            border: '2px solid #22c55e',
            boxShadow: '0 0 14px rgba(34,197,94,0.3)',
          }}
        >
          {pipe('left', 'rgba(134,239,172,0.9)')}
          {dot('rgba(134,239,172,0.9)')}
        </div>
      </div>
    );
  }

  if (type === 'rotatable') {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              ...tileBase,
              background: 'linear-gradient(145deg, #78350f, #5c2a0a)',
              border: '2px solid #f59e0b',
            }}
          >
            {pipe('up', 'rgba(252,211,77,0.9)')}
            {pipe('right', 'rgba(252,211,77,0.9)')}
            {dot('rgba(252,211,77,0.9)')}
            {rotateDot}
          </div>
          <div style={{ fontSize: 9, color: '#78350f' }}>BEFORE</div>
        </div>
        <div style={{ fontSize: 20, color: '#f59e0b' }}>→</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              ...tileBase,
              background: 'linear-gradient(145deg, #78350f, #5c2a0a)',
              border: '2px solid #fde68a',
              boxShadow: '0 0 18px rgba(253,230,138,0.5)',
            }}
          >
            {pipe('right', 'rgba(253,230,138,0.95)')}
            {pipe('down', 'rgba(253,230,138,0.95)')}
            {dot('rgba(253,230,138,0.95)')}
            {rotateDot}
          </div>
          <div style={{ fontSize: 9, color: '#f59e0b' }}>AFTER TAP</div>
        </div>
      </div>
    );
  }

  if (type === 'node') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg, #14532d, #0f3d21)',
            border: '2px solid #22c55e',
            boxShadow: '0 0 18px rgba(34,197,94,0.4)',
          }}
        >
          {pipe('right', 'rgba(134,239,172,0.9)')}
          {pipe('down', 'rgba(134,239,172,0.9)')}
          {dot('rgba(134,239,172,0.9)')}
        </div>
        <div style={{ fontSize: 10, color: '#22c55e', letterSpacing: '0.1em' }}>GOAL NODE</div>
      </div>
    );
  }

  if (type === 'controls') {
    return (
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid #3a3a5560',
              background: 'rgba(58,58,85,0.15)',
              color: '#818cf8',
              fontSize: 20,
            }}
          >
            ⎌
          </div>
          <div style={{ fontSize: 9, color: '#3a3a55' }}>UNDO</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid #f59e0b50',
              background: 'rgba(245,158,11,0.08)',
              color: '#fbbf24',
              fontSize: 20,
            }}
          >
            💡
          </div>
          <div style={{ fontSize: 9, color: '#f59e0b' }}>HINT</div>
        </div>
      </div>
    );
  }

  if (type === 'zen-ready' || type === 'ready') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 48, filter: `drop-shadow(0 0 20px ${modeColor}99)` }}>✦</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#22c55e', '#6366f1', '#f59e0b', '#ef4444'].map((c, i) => (
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
