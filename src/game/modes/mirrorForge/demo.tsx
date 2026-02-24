// MIRROR FORGE — Tutorial Demo Visuals

import { TutorialDemoType } from '../types';

const PURPLE = '#a78bfa';
const GREEN = '#34d399';
const PINK = '#f472b6';

function MirTile({
  rotated = false,
  isGoal = false,
  isCenter = false,
  active = false,
  small = false,
}: {
  type?: 'normal' | 'mirror-highlight' | 'goal';
  rotated?: boolean;
  isGoal?: boolean;
  isCenter?: boolean;
  active?: boolean;
  small?: boolean;
}) {
  const size = small ? 34 : 42;

  let bg = 'linear-gradient(145deg, #0d0d1a, #080812)';
  let border = `1px solid ${PURPLE}33`;
  let shadow: string | undefined;

  if (isCenter) {
    bg = 'linear-gradient(145deg, #1a0a2a, #0d0816)';
    border = `1px solid ${PURPLE}55`;
  }
  if (isGoal) {
    bg = `linear-gradient(145deg, ${PURPLE}33, #0d0816)`;
    border = `2px solid ${PURPLE}`;
    shadow = `0 0 12px ${PURPLE}66`;
  }
  if (active) {
    bg = `linear-gradient(145deg, ${GREEN}33, #0d1a16)`;
    border = `2px solid ${GREEN}`;
    shadow = `0 0 14px ${GREEN}77`;
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
        background: bg,
        border,
        boxShadow: shadow,
        transform: rotated ? 'rotate(90deg)' : undefined,
        transition: 'all 0.2s',
      }}
    >
      {isGoal && <span style={{ fontSize: '0.9rem' }}>◉</span>}
      {isCenter && <span style={{ fontSize: '0.6rem', color: PURPLE + '88' }}>┃</span>}
    </div>
  );
}

function Row({ children, gap = 4 }: { children: unknown; gap?: number }) {
  return <div style={{ display: 'flex', gap }}>{children as any}</div>;
}

export function renderMirrorForgeDemo(type: TutorialDemoType, _color: string) {
  switch (type) {
    case 'mirror-grid':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
          <Row>
            <MirTile />
            <MirTile />
            <MirTile isCenter />
            <MirTile />
            <MirTile />
          </Row>
          <Row>
            <MirTile isGoal />
            <MirTile />
            <MirTile isCenter />
            <MirTile />
            <MirTile isGoal />
          </Row>
          <Row>
            <MirTile />
            <MirTile />
            <MirTile isCenter />
            <MirTile />
            <MirTile />
          </Row>
          <div style={{ color: PURPLE + 'aa', fontSize: '0.65rem', marginTop: 3 }}>
            Left ←→ Right (always symmetric)
          </div>
        </div>
      );

    case 'mirror-tap':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
          <div style={{ color: '#6b7280', fontSize: '0.65rem' }}>Tap one tile...</div>
          <Row>
            <MirTile active />
            <MirTile />
            <MirTile isCenter />
            <MirTile />
            <MirTile active />
          </Row>
          <div
            style={{
              fontSize: '0.65rem',
              color: GREEN,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>rotate ↩</span>
            <span style={{ color: '#4b5563' }}>mirror</span>
            <span>↪ rotate</span>
          </div>
        </div>
      );

    case 'mirror-connect':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
          <Row>
            <MirTile isGoal />
            <MirTile active />
            <MirTile active isCenter />
            <MirTile active />
            <MirTile isGoal />
          </Row>
          <div style={{ color: GREEN, fontSize: '0.7rem', marginTop: 4, fontWeight: 700 }}>
            ◉ ─────── ┃ ─────── ◉
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.63rem' }}>
            Route pipes through the center
          </div>
        </div>
      );

    case 'mirror-plan':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
          <div style={{ color: '#6b7280', fontSize: '0.63rem', marginBottom: 2 }}>
            One tap fixes both sides
          </div>
          <Row>
            <MirTile />
            <MirTile active />
            <MirTile isCenter />
            <MirTile active />
            <MirTile />
          </Row>
          <div
            style={{
              padding: '4px 12px',
              borderRadius: 8,
              background: `${PURPLE}22`,
              border: `1px solid ${PURPLE}`,
              color: PURPLE,
              fontSize: '0.68rem',
            }}
          >
            💡 1 tap = 2 rotations
          </div>
        </div>
      );

    case 'mirror-ready':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
          <Row>
            <MirTile isGoal />
            <MirTile active />
            <MirTile active isCenter />
            <MirTile active />
            <MirTile isGoal />
          </Row>
          <Row>
            <MirTile active />
            <MirTile active />
            <MirTile active isCenter />
            <MirTile active />
            <MirTile active />
          </Row>
          <Row>
            <MirTile isGoal />
            <MirTile active />
            <MirTile active isCenter />
            <MirTile active />
            <MirTile isGoal />
          </Row>
          <div style={{ color: PINK, fontSize: '0.7rem', marginTop: 3, fontWeight: 700 }}>
            💎 All nodes connected!
          </div>
        </div>
      );

    default:
      return null;
  }
}
