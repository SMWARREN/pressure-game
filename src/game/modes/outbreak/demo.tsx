// PRESSURE - Outbreak Mode Tutorial Demos

import { TutorialDemoType } from '../types';

const OUTBREAK_COLORS: Record<number, string> = {
  0: '#ef4444',
  1: '#f97316',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#a855f7',
};

const OUTBREAK_ICONS: Record<number, string> = {
  0: '🧟',
  1: '🧟‍♂️',
  2: '🧟‍♀️',
  3: '💀',
  4: '🫀',
};

function OutbreakTile({
  colorIndex,
  owned = false,
  frontier = false,
  groupSize,
  small = false,
}: {
  colorIndex: number;
  owned?: boolean;
  frontier?: boolean;
  groupSize?: number;
  small?: boolean;
}) {
  const lit = OUTBREAK_COLORS[colorIndex] ?? '#888';
  const size = small ? 34 : 42;
  const fontSize = small ? '0.75rem' : '0.9rem';

  if (owned) {
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
          background: `linear-gradient(160deg, ${lit}bb 0%, #111ee 100%)`,
          border: `2px solid ${lit}99`,
          boxShadow: `0 0 6px ${lit}44`,
        }}
      >
        ☣️
      </div>
    );
  }

  if (frontier) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: small ? '0.8rem' : '1rem',
          fontWeight: 700,
          color: lit,
          background: 'linear-gradient(160deg, #0d0d1a 0%, #111 100%)',
          border: `2px solid ${lit}`,
          boxShadow: `0 0 14px ${lit}66`,
        }}
      >
        {groupSize ?? ''}
      </div>
    );
  }

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
        background: 'linear-gradient(160deg, #080810 0%, #111133 100%)',
        border: `1px solid ${lit}22`,
        opacity: 0.6,
      }}
    >
      {OUTBREAK_ICONS[colorIndex] ?? ''}
    </div>
  );
}

export function renderOutbreakDemo(
  type: TutorialDemoType,
  _modeColor: string
): React.ReactNode | null {
  if (type === 'outbreak-start') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            <OutbreakTile colorIndex={1} />
            <OutbreakTile colorIndex={2} />
            <OutbreakTile colorIndex={0} />
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            <OutbreakTile colorIndex={2} />
            <OutbreakTile colorIndex={1} frontier groupSize={3} />
            <OutbreakTile colorIndex={0} />
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            <OutbreakTile colorIndex={0} owned />
            <OutbreakTile colorIndex={0} frontier groupSize={2} />
            <OutbreakTile colorIndex={2} />
          </div>
        </div>
        <div
          style={{ fontSize: 10, color: '#06b6d4', letterSpacing: '0.1em', textAlign: 'center' }}
        >
          YOU START IN THE CORNER
        </div>
      </div>
    );
  }

  if (type === 'outbreak-frontier') {
    return (
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            <OutbreakTile colorIndex={0} owned small />
            <OutbreakTile colorIndex={0} owned small />
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            <OutbreakTile colorIndex={0} owned small />
            <OutbreakTile colorIndex={1} frontier groupSize={1} small />
          </div>
          <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>+1 cell</div>
        </div>
        <div style={{ fontSize: 18, color: '#25253a' }}>vs</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            <OutbreakTile colorIndex={0} owned small />
            <OutbreakTile colorIndex={0} owned small />
            <OutbreakTile colorIndex={0} owned small />
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            <OutbreakTile colorIndex={0} owned small />
            <OutbreakTile colorIndex={1} frontier groupSize={5} small />
            <OutbreakTile colorIndex={1} small />
          </div>
          <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>+5 cells!</div>
        </div>
      </div>
    );
  }

  if (type === 'outbreak-colors') {
    return (
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <OutbreakTile colorIndex={0} owned />
          <div style={{ fontSize: 9, color: '#06b6d4' }}>OWNED</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <OutbreakTile colorIndex={1} frontier groupSize={4} />
          <div style={{ fontSize: 9, color: '#f97316' }}>TAPPABLE</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <OutbreakTile colorIndex={2} />
          <div style={{ fontSize: 9, color: '#3a3a55' }}>BLOCKED</div>
        </div>
      </div>
    );
  }

  if (type === 'outbreak-ready') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 48, filter: 'drop-shadow(0 0 20px rgba(6,182,212,0.8))' }}>🦠</div>
        <div style={{ fontSize: 11, color: '#06b6d4', letterSpacing: '0.15em', fontWeight: 700 }}>
          INFECT EVERY CELL
        </div>
      </div>
    );
  }

  return null;
}
