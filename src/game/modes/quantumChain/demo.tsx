// PRESSURE - Quantum Chain Mode Tutorial Demos

import { TutorialDemoType } from '../types';

function QuantumTile({
  type,
  value,
  symbol,
  fulfilled = false,
  small = false,
}: {
  type: 'number' | 'operator' | 'target' | 'flux';
  value?: number;
  symbol?: string;
  fulfilled?: boolean;
  small?: boolean;
}) {
  const size = small ? 34 : 42;
  const fontSize = small ? '0.9rem' : '1.1rem';

  const styles: Record<string, React.CSSProperties> = {
    number: {
      background: 'linear-gradient(145deg, #1e3a5f 0%, #0d1f33 100%)',
      border: '2px solid #3b82f6',
      boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)',
      color: '#93c5fd',
    },
    operator: {
      background: 'linear-gradient(145deg, #4c1d95 0%, #2e1065 100%)',
      border: '2px solid #8b5cf6',
      boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)',
      color: '#c4b5fd',
    },
    target: fulfilled
      ? {
          background: 'linear-gradient(145deg, #14532d 0%, #052e16 100%)',
          border: '2px solid #22c55e',
          boxShadow: '0 0 12px rgba(34, 197, 94, 0.5)',
          color: '#86efac',
        }
      : {
          background: 'linear-gradient(145deg, #78350f 0%, #451a03 100%)',
          border: '2px solid #f59e0b',
          boxShadow: '0 0 12px rgba(245, 158, 11, 0.5)',
          color: '#fcd34d',
        },
    flux: {
      background: 'linear-gradient(145deg, #7f1d1d 0%, #450a0a 100%)',
      border: '2px solid #ef4444',
      boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
      color: '#fca5a5',
    },
  };

  const displayValue =
    type === 'target' ? (fulfilled ? '✓' : value) : type === 'flux' ? symbol : value;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 700,
        ...styles[type],
      }}
    >
      {displayValue}
    </div>
  );
}

export function renderQuantumChainDemo(
  type: TutorialDemoType,
  _modeColor: string
): React.ReactNode | null {
  if (type === 'quantum-chain') {
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <QuantumTile type="number" value={3} />
        <div style={{ fontSize: 14, color: '#8b5cf6' }}>→</div>
        <QuantumTile type="operator" symbol="+" />
        <div style={{ fontSize: 14, color: '#8b5cf6' }}>→</div>
        <QuantumTile type="number" value={5} />
        <div style={{ fontSize: 14, color: '#8b5cf6' }}>→</div>
        <QuantumTile type="target" value={8} />
      </div>
    );
  }

  if (type === 'quantum-start') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <QuantumTile type="number" value={7} />
          <div style={{ fontSize: 12, color: '#3a3a55' }}>tap to start</div>
        </div>
        <div style={{ fontSize: 10, color: '#3b82f6', letterSpacing: '0.1em' }}>
          BLUE = NUMBER TILES
        </div>
      </div>
    );
  }

  if (type === 'quantum-extend') {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <QuantumTile type="number" value={4} small />
          <div style={{ fontSize: 8, color: '#3b82f6' }}>START</div>
        </div>
        <div style={{ fontSize: 16, color: '#8b5cf6' }}>→</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <QuantumTile type="operator" symbol="×" small />
          <div style={{ fontSize: 8, color: '#8b5cf6' }}>OPERATOR</div>
        </div>
        <div style={{ fontSize: 16, color: '#8b5cf6' }}>→</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <QuantumTile type="number" value={3} small />
          <div style={{ fontSize: 8, color: '#3b82f6' }}>NEXT</div>
        </div>
      </div>
    );
  }

  if (type === 'quantum-target') {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            <QuantumTile type="number" value={2} small />
            <QuantumTile type="operator" symbol="+" small />
            <QuantumTile type="number" value={3} small />
          </div>
          <div style={{ fontSize: 9, color: '#3a3a55' }}>2 + 3 = 5</div>
        </div>
        <div style={{ fontSize: 16, color: '#f59e0b' }}>→</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <QuantumTile type="target" value={5} fulfilled small />
          <div style={{ fontSize: 9, color: '#22c55e' }}>MATCH!</div>
        </div>
      </div>
    );
  }

  if (type === 'quantum-flux') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 3 }}>
          <QuantumTile type="number" value={4} small />
          <QuantumTile type="flux" symbol="×2" small />
          <QuantumTile type="number" value={8} small />
        </div>
        <div style={{ fontSize: 10, color: '#ef4444', letterSpacing: '0.05em' }}>
          FLUX DOUBLES ADJACENT NUMBERS
        </div>
      </div>
    );
  }

  if (type === 'quantum-ready') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <QuantumTile type="number" value={1} small />
          <QuantumTile type="operator" symbol="+" small />
          <QuantumTile type="number" value={2} small />
          <QuantumTile type="operator" symbol="×" small />
          <QuantumTile type="number" value={3} small />
        </div>
        <div style={{ fontSize: 11, color: '#8b5cf6', letterSpacing: '0.15em', fontWeight: 700 }}>
          BUILD CHAINS · HIT TARGETS
        </div>
      </div>
    );
  }

  return null;
}
