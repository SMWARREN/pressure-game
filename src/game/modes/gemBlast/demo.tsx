// GEM BLAST MODE — Tutorial Demo Visuals

import type { TutorialDemoType, TileColors } from '../types';

// ── Gem color palette ─────────────────────────────────────────────────────────

const GEM_COLORS: Record<string, TileColors> = {
  '💎': {
    background: '#062d35',
    border: '2px solid #06b6d4',
    boxShadow: '0 0 10px rgba(6,182,212,0.6)',
  },
  '💍': {
    background: '#2d2500',
    border: '2px solid #d4af37',
    boxShadow: '0 0 10px rgba(212,175,55,0.6)',
  },
  '🔮': {
    background: '#1a0a2d',
    border: '2px solid #8b5cf6',
    boxShadow: '0 0 10px rgba(139,92,246,0.6)',
  },
  '🟣': {
    background: '#1a082d',
    border: '2px solid #a855f7',
    boxShadow: '0 0 10px rgba(168,85,247,0.6)',
  },
  '🔵': {
    background: '#062040',
    border: '2px solid #3b82f6',
    boxShadow: '0 0 10px rgba(59,130,246,0.6)',
  },
  '💥': {
    background: '#2d1400',
    border: '2px solid #f97316',
    boxShadow: '0 0 18px rgba(249,115,22,0.9)',
  },
};

// ── Gem tile component ────────────────────────────────────────────────────────

function GemTile({
  symbol,
  size = 32,
  highlight = false,
}: {
  symbol: string;
  size?: number;
  highlight?: boolean;
}) {
  const colors = GEM_COLORS[symbol] ?? {
    background: '#0a0a1e',
    border: '2px solid #6366f1',
    boxShadow: '0 0 10px rgba(99,102,241,0.5)',
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.5,
        lineHeight: 1,
        ...colors,
        ...(highlight
          ? { border: '2px solid #e0f2fe', boxShadow: '0 0 18px rgba(224,242,254,0.75)' }
          : {}),
      }}
    >
      {symbol}
    </div>
  );
}

// ── Empty slot component ──────────────────────────────────────────────────────

function EmptySlot({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: 'rgba(10,10,20,0.3)',
        border: '1px dashed #1e1e35',
      }}
    />
  );
}

// ── Demo renderer ─────────────────────────────────────────────────────────────

export function renderGemBlastDemo(
  type: TutorialDemoType,
  _modeColor: string
): React.ReactNode | null {
  const tileSize = 28;
  const gap = 3;

  switch (type) {
    case 'gemblast-tap': {
      // 3×3 grid with a highlighted group of 💎
      const grid = [
        ['💎', '💍', '🔮'],
        ['💎', '💎', '🟣'],
        ['🔵', '💍', '💎'],
      ];
      const highlights = ['0,0', '1,0', '0,1', '1,1']; // Top-left 2×2

      return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${tileSize}px)`, gap }}>
          {grid.flat().map((sym, i) => (
            <GemTile
              key={i}
              symbol={sym}
              size={tileSize}
              highlight={highlights.includes(`${i % 3},${Math.floor(i / 3)}`)}
            />
          ))}
        </div>
      );
    }

    case 'gemblast-cascade': {
      // Show before/after: cleared gems → new group formed
      return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(3, ${tileSize}px)`,
                gap,
                marginBottom: 4,
              }}
            >
              <GemTile symbol="🔵" size={tileSize} />
              <EmptySlot size={tileSize} />
              <EmptySlot size={tileSize} />
              <GemTile symbol="💍" size={tileSize} />
              <EmptySlot size={tileSize} />
              <EmptySlot size={tileSize} />
              <GemTile symbol="🔵" size={tileSize} />
              <GemTile symbol="💍" size={tileSize} />
              <GemTile symbol="💍" size={tileSize} highlight />
            </div>
            <div style={{ fontSize: 8, color: '#4a4a6a' }}>After tap</div>
          </div>
          <div style={{ fontSize: 16, color: '#06b6d4' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(3, ${tileSize}px)`,
                gap,
                marginBottom: 4,
              }}
            >
              <GemTile symbol="🔵" size={tileSize} />
              <GemTile symbol="💍" size={tileSize} />
              <GemTile symbol="💍" size={tileSize} highlight />
              <GemTile symbol="🔵" size={tileSize} />
              <GemTile symbol="💍" size={tileSize} />
              <GemTile symbol="💍" size={tileSize} highlight />
              <EmptySlot size={tileSize} />
              <EmptySlot size={tileSize} />
              <EmptySlot size={tileSize} />
            </div>
            <div style={{ fontSize: 8, color: '#06b6d4' }}>CASCADE ×2!</div>
          </div>
        </div>
      );
    }

    case 'gemblast-blast': {
      // Show blast gem detonating a color
      return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(3, ${tileSize}px)`,
                gap,
                marginBottom: 4,
              }}
            >
              <GemTile symbol="💎" size={tileSize} />
              <GemTile symbol="💥" size={tileSize} highlight />
              <GemTile symbol="💍" size={tileSize} />
              <GemTile symbol="💎" size={tileSize} />
              <GemTile symbol="🔮" size={tileSize} />
              <GemTile symbol="💎" size={tileSize} />
              <GemTile symbol="🟣" size={tileSize} />
              <GemTile symbol="💎" size={tileSize} />
              <GemTile symbol="🔵" size={tileSize} />
            </div>
            <div style={{ fontSize: 8, color: '#4a4a6a' }}>Tap the 💥</div>
          </div>
          <div style={{ fontSize: 16, color: '#f97316' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(3, ${tileSize}px)`,
                gap,
                marginBottom: 4,
              }}
            >
              <EmptySlot size={tileSize} />
              <EmptySlot size={tileSize} />
              <GemTile symbol="💍" size={tileSize} />
              <EmptySlot size={tileSize} />
              <GemTile symbol="🔮" size={tileSize} />
              <EmptySlot size={tileSize} />
              <GemTile symbol="🟣" size={tileSize} />
              <EmptySlot size={tileSize} />
              <GemTile symbol="🔵" size={tileSize} />
            </div>
            <div style={{ fontSize: 8, color: '#f97316' }}>All 💎 cleared!</div>
          </div>
        </div>
      );
    }

    case 'gemblast-ready': {
      // All 5 gem types glowing
      return (
        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 120,
          }}
        >
          {['💎', '💍', '🔮', '🟣', '🔵', '💥'].map((sym) => (
            <GemTile key={sym} symbol={sym} size={tileSize} highlight />
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}
