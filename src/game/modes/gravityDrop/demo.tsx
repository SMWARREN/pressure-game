// GRAVITY DROP — Tutorial Demo Visuals

import { TutorialDemoType } from '../types';

const ACCENT = '#38bdf8';
const PINK = '#f472b6';

const VALUE_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: '#0c1a2e', border: '#38bdf8', text: '#7dd3fc' },
  2: { bg: '#1a0c2e', border: '#818cf8', text: '#a5b4fc' },
  3: { bg: '#2e0c1a', border: '#f472b6', text: '#f9a8d4' },
  4: { bg: '#1a2e0c', border: '#4ade80', text: '#86efac' },
  5: { bg: '#2e1a0c', border: '#fb923c', text: '#fdba74' },
  6: { bg: '#2e2e0c', border: '#fbbf24', text: '#fde68a' },
};

function GravTile({
  value,
  inChain = false,
  chainSum,
  special = 'none',
  empty = false,
  small = false,
}: {
  value?: number;
  inChain?: boolean;
  chainSum?: number;
  special?: 'none' | 'bomb' | 'star' | 'lock';
  empty?: boolean;
  small?: boolean;
}) {
  const size = small ? 36 : 44;
  const fontSize = small ? '1rem' : '1.2rem';

  if (empty) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 7,
          background: '#080812',
          border: '1px solid #1a1a2e',
        }}
      />
    );
  }

  const sym =
    special === 'bomb'
      ? '💣'
      : special === 'star'
        ? '⭐'
        : special === 'lock'
          ? '🔒'
          : ['①', '②', '③', '④', '⑤', '⑥'][(value ?? 1) - 1];
  const col = value ? VALUE_COLORS[value] : { bg: '#1a1a2e', border: '#6b7280', text: '#9ca3af' };

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        background: inChain
          ? `linear-gradient(145deg, ${col.border}44, ${col.bg})`
          : `linear-gradient(145deg, ${col.bg}, #080812)`,
        border: inChain ? `2px solid ${col.border}` : `1px solid ${col.border}66`,
        boxShadow: inChain ? `0 0 14px ${col.border}88` : undefined,
        position: 'relative',
      }}
    >
      <span>{sym}</span>
      {inChain && chainSum !== undefined && (
        <span
          style={{
            position: 'absolute',
            bottom: 1,
            right: 3,
            fontSize: '0.5rem',
            color: col.text,
            fontWeight: 700,
          }}
        >
          {chainSum}
        </span>
      )}
    </div>
  );
}

function Row({ children }: { children: unknown }) {
  return <div style={{ display: 'flex', gap: 5 }}>{children as any}</div>;
}

export function renderGravityDropDemo(type: TutorialDemoType, _color: string) {
  switch (type) {
    case 'gravity-board':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
          <Row>
            <GravTile empty />
            <GravTile empty />
            <GravTile empty />
          </Row>
          <Row>
            <GravTile value={3} />
            <GravTile empty />
            <GravTile value={2} />
          </Row>
          <Row>
            <GravTile value={4} />
            <GravTile value={6} />
            <GravTile value={1} />
          </Row>
          <Row>
            <GravTile value={2} />
            <GravTile value={3} />
            <GravTile value={5} />
          </Row>
          <div style={{ color: '#6b7280', fontSize: '0.65rem', marginTop: 3 }}>
            Numbers fill from the bottom
          </div>
        </div>
      );

    case 'gravity-chain':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
          <Row>
            <GravTile value={3} inChain chainSum={3} />
            <GravTile value={4} inChain chainSum={7} />
            <GravTile value={3} inChain chainSum={10} />
          </Row>
          <Row>
            <GravTile value={2} />
            <GravTile value={1} />
            <GravTile value={5} />
          </Row>
          <div
            style={{
              marginTop: 4,
              padding: '3px 10px',
              borderRadius: 8,
              background: `${ACCENT}22`,
              border: `1px solid ${ACCENT}`,
              color: ACCENT,
              fontSize: '0.7rem',
              fontWeight: 700,
            }}
          >
            3 + 4 + 3 = 10 ✓
          </div>
        </div>
      );

    case 'gravity-commit':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
          <Row>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 7,
                background: '#080812',
                border: '1px dashed #38bdf833',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                color: '#38bdf855',
              }}
            >
              ↓
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 7,
                background: '#080812',
                border: '1px dashed #38bdf833',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                color: '#38bdf855',
              }}
            >
              ↓
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 7,
                background: '#080812',
                border: '1px dashed #38bdf833',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                color: '#38bdf855',
              }}
            >
              ↓
            </div>
          </Row>
          <Row>
            <GravTile value={2} />
            <GravTile value={1} />
            <GravTile value={5} />
          </Row>
          <div style={{ color: '#4ade80', fontSize: '0.68rem', marginTop: 3 }}>
            💥 Cleared! Gravity refills from top
          </div>
        </div>
      );

    case 'gravity-specials':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
          <Row>
            <GravTile value={5} inChain chainSum={5} />
            <GravTile special="star" inChain chainSum={10} />
          </Row>
          <Row>
            <GravTile special="bomb" />
            <GravTile special="lock" />
          </Row>
          <div style={{ color: '#fbbf24', fontSize: '0.65rem', marginTop: 3 }}>
            ⭐ fills the gap · 💣 nukes column
          </div>
        </div>
      );

    case 'gravity-ready':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
          <Row>
            <GravTile value={2} />
            <GravTile value={4} />
            <GravTile value={1} />
          </Row>
          <Row>
            <GravTile value={3} />
            <GravTile value={5} />
            <GravTile value={2} />
          </Row>
          <div
            style={{
              marginTop: 6,
              padding: '3px 12px',
              borderRadius: 8,
              background: `${PINK}22`,
              border: `1px solid ${PINK}`,
              color: PINK,
              fontSize: '0.7rem',
              fontWeight: 700,
            }}
          >
            Chain to 10 — beat the target!
          </div>
        </div>
      );

    default:
      return null;
  }
}
