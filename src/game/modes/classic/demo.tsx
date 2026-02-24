// PRESSURE - Classic Mode Tutorial Demos

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

const pipe = (dir: 'up' | 'down' | 'left' | 'right', color: string) => {
  const styles: Record<string, React.CSSProperties> = {
    up: {
      position: 'absolute',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 5,
      height: '53%',
      background: color,
      borderRadius: '3px 3px 0 0',
    },
    down: {
      position: 'absolute',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 5,
      height: '53%',
      background: color,
      borderRadius: '0 0 3px 3px',
    },
    left: {
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      height: 5,
      width: '53%',
      background: color,
      borderRadius: '3px 0 0 3px',
    },
    right: {
      position: 'absolute',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      height: 5,
      width: '53%',
      background: color,
      borderRadius: '0 3px 3px 0',
    },
  };
  return <div key={dir} style={styles[dir]} />;
};

const dot = (color: string) => (
  <div
    style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%,-50%)',
      width: 8,
      height: 8,
      background: color,
      borderRadius: '50%',
      zIndex: 1,
    }}
  />
);

const rotateDot = (
  <div
    style={{
      position: 'absolute',
      top: 3,
      right: 3,
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: '#fcd34d',
      zIndex: 2,
    }}
  />
);

export function renderClassicDemo(type: TutorialDemoType, modeColor: string): React.ReactNode | null {
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
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: '40%',
              height: '40%',
              border: '2px solid rgba(134,239,172,0.5)',
              borderRadius: '50%',
              zIndex: 1,
            }}
          />
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
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: '40%',
              height: '40%',
              border: '2px solid rgba(134,239,172,0.5)',
              borderRadius: '50%',
              zIndex: 1,
            }}
          />
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
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: '42%',
              height: '42%',
              border: '2px solid rgba(134,239,172,0.5)',
              borderRadius: '50%',
              zIndex: 1,
            }}
          />
        </div>
        <div style={{ fontSize: 10, color: '#22c55e', letterSpacing: '0.1em' }}>GOAL NODE</div>
      </div>
    );
  }

  if (type === 'connection') {
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg, #1e3060, #172349)',
            border: '1.5px solid #2a4080',
          }}
        >
          {pipe('right', 'rgba(147,197,253,0.85)')}
          {dot('rgba(147,197,253,0.85)')}
        </div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg, #1e3060, #172349)',
            border: '1.5px solid #2a4080',
          }}
        >
          {pipe('left', 'rgba(147,197,253,0.85)')}
          {pipe('right', 'rgba(147,197,253,0.85)')}
          {dot('rgba(147,197,253,0.85)')}
        </div>
        <div
          style={{
            ...tileBase,
            background: 'linear-gradient(145deg, #1e3060, #172349)',
            border: '1.5px solid #2a4080',
          }}
        >
          {pipe('left', 'rgba(147,197,253,0.85)')}
          {dot('rgba(147,197,253,0.85)')}
        </div>
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

  if (type === 'ready') {
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