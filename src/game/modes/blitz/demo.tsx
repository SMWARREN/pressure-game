// PRESSURE - Blitz Mode Tutorial Demos

import { TutorialDemoType } from '../types';
import { tileBase, pipe, dot, rotateDot } from '../shared/demoUtils';

export function renderBlitzDemo(
  type: TutorialDemoType,
  _modeColor: string
): React.ReactNode | null {
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
              boxShadow: '0 0 8px rgba(245,158,11,0.2)',
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

  if (type === 'walls') {
    return (
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '2px solid rgba(239,68,68,0.5)',
            borderRadius: 12,
            background: 'rgba(239,68,68,0.06)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 18,
            background: 'linear-gradient(180deg, rgba(239,68,68,0.3) 0%, transparent 100%)',
            borderBottom: '2px solid rgba(239,68,68,0.4)',
            borderRadius: '12px 12px 0 0',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 18,
            background: 'linear-gradient(0deg, rgba(239,68,68,0.3) 0%, transparent 100%)',
            borderTop: '2px solid rgba(239,68,68,0.4)',
            borderRadius: '0 0 12px 12px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 18,
            background: 'linear-gradient(90deg, rgba(239,68,68,0.3) 0%, transparent 100%)',
            borderRight: '2px solid rgba(239,68,68,0.4)',
            borderRadius: '12px 0 0 12px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 18,
            background: 'linear-gradient(270deg, rgba(239,68,68,0.3) 0%, transparent 100%)',
            borderLeft: '2px solid rgba(239,68,68,0.4)',
            borderRadius: '0 12px 12px 0',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 28, filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.5))' }}>💀</div>
        </div>
      </div>
    );
  }

  if (type === 'blitz-ready') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 48, filter: 'drop-shadow(0 0 20px rgba(249,115,22,0.8))' }}>🔥</div>
        <div style={{ fontSize: 11, color: '#f97316', letterSpacing: '0.15em', fontWeight: 700 }}>
          SURVIVE
        </div>
      </div>
    );
  }

  return null;
}
