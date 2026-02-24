// PRESSURE - Candy Mode Tutorial Demos

import { TutorialDemoType } from '../types';

const CANDY_COLORS: Record<string, string> = {
  '🍎': '#ef4444',
  '🍊': '#f97316',
  '🍋': '#eab308',
  '🫐': '#6366f1',
  '🍓': '#ec4899',
};

function CandyTile({ sym, highlight = false, small = false }: { sym: string; highlight?: boolean; small?: boolean }) {
  const col = CANDY_COLORS[sym] ?? '#6366f1';
  const size = small ? 34 : 42;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: small ? '1rem' : '1.2rem',
        background: highlight ? `linear-gradient(145deg, ${col}44 0%, ${col}22 100%)` : 'rgba(10,10,20,0.6)',
        border: `2px solid ${highlight ? col : col + '30'}`,
        boxShadow: highlight ? `0 0 12px ${col}70` : 'none',
        opacity: highlight ? 1 : 0.35,
      }}
    >
      {sym}
    </div>
  );
}

export function renderCandyDemo(type: TutorialDemoType, _modeColor: string): React.ReactNode | null {
  if (type === 'candy-group') {
    const grid = [
      ['🍎', '🍎', '🍊'],
      ['🍎', '🫐', '🫐'],
      ['🍋', '🫐', '🍓'],
    ];
    const inGroup = (r: number, c: number) => (r === 0 && c < 2) || (r === 1 && c === 0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {grid.map((row, r) => (
          <div key={r} style={{ display: 'flex', gap: 3 }}>
            {row.map((sym, c) => (
              <CandyTile key={c} sym={sym} highlight={inGroup(r, c)} />
            ))}
          </div>
        ))}
        <div style={{ marginTop: 8, fontSize: 10, color: '#ef4444', letterSpacing: '0.1em', textAlign: 'center' }}>
          GROUP OF 3 — TAP ANY TO CLEAR ALL
        </div>
      </div>
    );
  }

  if (type === 'candy-score') {
    return (
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            <CandyTile sym="🍎" highlight />
            <CandyTile sym="🍎" highlight />
          </div>
          <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 800 }}>20 pts</div>
          <div style={{ fontSize: 9, color: '#3a3a55' }}>2 tiles</div>
        </div>
        <div style={{ fontSize: 18, color: '#25253a', marginTop: 10 }}>vs</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              <CandyTile sym="🍎" highlight />
              <CandyTile sym="🍎" highlight />
              <CandyTile sym="🍎" highlight />
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              <CandyTile sym="🍎" highlight />
              <CandyTile sym="🍎" highlight />
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 800 }}>125 pts</div>
          <div style={{ fontSize: 9, color: '#3a3a55' }}>5 tiles</div>
        </div>
      </div>
    );
  }

  if (type === 'candy-gravity') {
    return (
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              <CandyTile sym="🍊" highlight small />
              <CandyTile sym="🍋" highlight small />
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              <CandyTile sym="🍎" highlight={false} small />
              <CandyTile sym="🍎" highlight={false} small />
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              <CandyTile sym="🫐" highlight small />
              <CandyTile sym="🍓" highlight small />
            </div>
          </div>
          <div style={{ fontSize: 9, color: '#3a3a55' }}>BEFORE</div>
        </div>
        <div style={{ fontSize: 16, color: '#25253a' }}>→</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              <div style={{ width: 34, height: 34, borderRadius: 7, background: 'rgba(165,180,252,0.1)', border: '2px dashed #a5b4fc30' }} />
              <div style={{ width: 34, height: 34, borderRadius: 7, background: 'rgba(165,180,252,0.1)', border: '2px dashed #a5b4fc30' }} />
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              <CandyTile sym="🍊" highlight small />
              <CandyTile sym="🍋" highlight small />
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              <CandyTile sym="🫐" highlight small />
              <CandyTile sym="🍓" highlight small />
            </div>
          </div>
          <div style={{ fontSize: 9, color: '#a5b4fc' }}>NEW TILES</div>
        </div>
      </div>
    );
  }

  if (type === 'candy-ready') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['🍎', '🍊', '🍋', '🫐', '🍓'].map((sym) => {
            const col = CANDY_COLORS[sym];
            return (
              <div
                key={sym}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  background: `linear-gradient(145deg, ${col}33, ${col}11)`,
                  border: `2px solid ${col}`,
                  boxShadow: `0 0 14px ${col}60`,
                }}
              >
                {sym}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: '#f472b6', letterSpacing: '0.15em', fontWeight: 700 }}>
          CLEAR GROUPS · SCORE POINTS
        </div>
      </div>
    );
  }

  return null;
}