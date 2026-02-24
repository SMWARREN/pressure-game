// PRESSURE - Memory Match Tutorial Demos

import { TutorialDemoType } from '../types';

const ACCENT = '#818cf8';
const MATCH_COLOR = '#34d399';
const FLIP_COLOR = '#fbbf24';

function MemTile({
  face,
  matched = false,
  flipped = false,
  faceDown = false,
}: {
  face: string;
  matched?: boolean;
  flipped?: boolean;
  faceDown?: boolean;
}) {
  let bg = 'linear-gradient(145deg, #0f0e1a, #080812)';
  let border = `1px solid ${ACCENT}22`;
  let shadow: string | undefined;
  let symbol = '❓';

  if (matched) {
    bg = 'linear-gradient(145deg, #064e3b, #022c22)';
    border = `2px solid ${MATCH_COLOR}`;
    shadow = `0 0 10px ${MATCH_COLOR}55`;
    symbol = face;
  } else if (flipped) {
    bg = 'linear-gradient(145deg, #422006, #1c0f03)';
    border = `2px solid ${FLIP_COLOR}`;
    shadow = `0 0 14px ${FLIP_COLOR}77`;
    symbol = face;
  } else if (faceDown) {
    symbol = '❓';
  }

  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.3rem',
        background: bg,
        border,
        boxShadow: shadow,
      }}
    >
      {symbol}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 6 }}>{children}</div>;
}

export function renderMemoryMatchDemo(type: TutorialDemoType, _modeColor: string) {
  switch (type) {
    case 'memory-hidden':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <Row>
            <MemTile face="🌟" faceDown />
            <MemTile face="🎵" faceDown />
            <MemTile face="🌟" faceDown />
          </Row>
          <Row>
            <MemTile face="🎵" faceDown />
            <MemTile face="🔥" faceDown />
            <MemTile face="🔥" faceDown />
          </Row>
          <div style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: 4 }}>
            All tiles start hidden
          </div>
        </div>
      );

    case 'memory-flip':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <Row>
            <MemTile face="🌟" flipped />
            <MemTile face="🎵" faceDown />
            <MemTile face="🌟" flipped />
          </Row>
          <Row>
            <MemTile face="🎵" faceDown />
            <MemTile face="🔥" faceDown />
            <MemTile face="🔥" faceDown />
          </Row>
          <div style={{ color: MATCH_COLOR, fontSize: '0.7rem', marginTop: 4 }}>
            ⭐ Match! Both lock in
          </div>
        </div>
      );

    case 'memory-nomatch':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <Row>
            <MemTile face="🌟" flipped />
            <MemTile face="🎵" faceDown />
            <MemTile face="🔥" flipped />
          </Row>
          <Row>
            <MemTile face="🎵" faceDown />
            <MemTile face="🌟" faceDown />
            <MemTile face="🔥" faceDown />
          </Row>
          <div style={{ color: '#f87171', fontSize: '0.7rem', marginTop: 4 }}>
            ✗ No match — flip back! Remember them.
          </div>
        </div>
      );

    case 'memory-combo': {
      const comboColor = '#fb923c';
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <Row>
            <MemTile face="🌟" matched />
            <MemTile face="🌟" matched />
            <MemTile face="🎵" matched />
            <MemTile face="🎵" matched />
          </Row>
          <div
            style={{
              marginTop: 6,
              padding: '4px 12px',
              borderRadius: 8,
              background: `${comboColor}22`,
              border: `1px solid ${comboColor}`,
              color: comboColor,
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            🔥 2× Combo! +200 pts
          </div>
        </div>
      );
    }

    case 'memory-ready':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <Row>
            <MemTile face="🌟" matched />
            <MemTile face="🌟" matched />
            <MemTile face="🎵" matched />
            <MemTile face="🎵" matched />
          </Row>
          <Row>
            <MemTile face="🔥" matched />
            <MemTile face="🔥" matched />
            <MemTile face="💎" matched />
            <MemTile face="💎" matched />
          </Row>
          <div style={{ color: MATCH_COLOR, fontSize: '0.75rem', marginTop: 4, fontWeight: 700 }}>
            🏆 All pairs matched!
          </div>
        </div>
      );

    default:
      return null;
  }
}
