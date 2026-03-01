// PRESSURE - Candy Mode Tutorial Demos

import { TutorialDemoType } from '../types';
import { ArcadeTile } from '../shared/arcadeTile';

const CANDY_COLORS: Record<string, string> = {
  '🍎': '#ef4444',
  '🍊': '#f97316',
  '🍋': '#eab308',
  '🫐': '#6366f1',
  '🍓': '#ec4899',
};

export function renderCandyDemo(
  type: TutorialDemoType,
  _modeColor: string
): React.ReactNode | null {
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
          <div key={`row-${r}`} style={{ display: 'flex', gap: 3 }}>
            {row.map((sym, c) => (
              <ArcadeTile colors={CANDY_COLORS} key={`cell-${r}-${c}`} sym={sym} highlight={inGroup(r, c)} />
            ))}
          </div>
        ))}
        <div
          style={{
            marginTop: 8,
            fontSize: 10,
            color: '#ef4444',
            letterSpacing: '0.1em',
            textAlign: 'center',
          }}
        >
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
            <ArcadeTile colors={CANDY_COLORS} sym="🍎" highlight />
            <ArcadeTile colors={CANDY_COLORS} sym="🍎" highlight />
          </div>
          <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 800 }}>20 pts</div>
          <div style={{ fontSize: 9, color: '#3a3a55' }}>2 tiles</div>
        </div>
        <div style={{ fontSize: 18, color: '#25253a', marginTop: 10 }}>vs</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              <ArcadeTile colors={CANDY_COLORS} sym="🍎" highlight />
              <ArcadeTile colors={CANDY_COLORS} sym="🍎" highlight />
              <ArcadeTile colors={CANDY_COLORS} sym="🍎" highlight />
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              <ArcadeTile colors={CANDY_COLORS} sym="🍎" highlight />
              <ArcadeTile colors={CANDY_COLORS} sym="🍎" highlight />
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
              <ArcadeTile colors={CANDY_COLORS} sym="🍊" highlight small />
              <ArcadeTile colors={CANDY_COLORS} sym="🍋" highlight small />
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              <ArcadeTile colors={CANDY_COLORS} sym="🍎" highlight={false} small />
              <ArcadeTile colors={CANDY_COLORS} sym="🍎" highlight={false} small />
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              <ArcadeTile colors={CANDY_COLORS} sym="🫐" highlight small />
              <ArcadeTile colors={CANDY_COLORS} sym="🍓" highlight small />
            </div>
          </div>
          <div style={{ fontSize: 9, color: '#3a3a55' }}>BEFORE</div>
        </div>
        <div style={{ fontSize: 16, color: '#25253a' }}>→</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 7,
                  background: 'rgba(165,180,252,0.1)',
                  border: '2px dashed #a5b4fc30',
                }}
              />
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 7,
                  background: 'rgba(165,180,252,0.1)',
                  border: '2px dashed #a5b4fc30',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              <ArcadeTile colors={CANDY_COLORS} sym="🍊" highlight small />
              <ArcadeTile colors={CANDY_COLORS} sym="🍋" highlight small />
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              <ArcadeTile colors={CANDY_COLORS} sym="🫐" highlight small />
              <ArcadeTile colors={CANDY_COLORS} sym="🍓" highlight small />
            </div>
          </div>
          <div style={{ fontSize: 9, color: '#a5b4fc' }}>NEW TILES</div>
        </div>
      </div>
    );
  }

  if (type === 'candy-ice') {
    const grid = [
      ['🍎', '🧊', '🍊'],
      ['🍎', '🍎', '🧊'],
      ['🍋', '🫐', '🍓'],
    ];
    const inGroup = (r: number, c: number) =>
      (r === 1 && c === 0) || (r === 1 && c === 1) || (r === 0 && c === 0);
    const isIce = (r: number, c: number) => grid[r][c] === '🧊';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {grid.map((row, r) => (
            <div key={`row-${r}`} style={{ display: 'flex', gap: 3 }}>
              {row.map((sym, c) =>
                isIce(r, c) ? (
                  <div
                    key={`ice-${r}-${c}`}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 7,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      background: 'linear-gradient(145deg, #a5b4fc33, #818cf811)',
                      border: '2px solid #a5b4fc80',
                      boxShadow: '0 0 10px #a5b4fc40',
                    }}
                  >
                    🧊
                  </div>
                ) : (
                  <ArcadeTile colors={CANDY_COLORS} key={`cell-${r}-${c}`} sym={sym} highlight={inGroup(r, c)} />
                )
              )}
            </div>
          ))}
        </div>
        <div
          style={{ fontSize: 10, color: '#a5b4fc', letterSpacing: '0.1em', textAlign: 'center' }}
        >
          MATCH 3+ NEARBY → SMASH ICE
        </div>
      </div>
    );
  }

  if (type === 'candy-unlock') {
    const bonusSymbols = ['🍇', '🥝', '🍒'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {['🍎', '🍎', '🍎'].map((sym, i) => (
                <ArcadeTile colors={CANDY_COLORS} key={`apple-${i}`} sym={sym} highlight />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {['🍎', '🍎'].map((sym, i) => (
                <ArcadeTile colors={CANDY_COLORS} key={`apple2-${i}`} sym={sym} highlight />
              ))}
            </div>
            <div style={{ fontSize: 9, color: '#ef4444' }}>5+ COMBO</div>
          </div>
          <div style={{ fontSize: 18, color: '#fbbf24' }}>→</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {bonusSymbols.map((sym) => (
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
                    background: 'linear-gradient(145deg, #fbbf2433, #fbbf2411)',
                    border: '2px solid #fbbf24',
                    boxShadow: '0 0 12px #fbbf2470',
                  }}
                >
                  {sym}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 9, color: '#fbbf24', fontWeight: 700 }}>2× SCORE ✨</div>
          </div>
        </div>
        <div
          style={{ fontSize: 10, color: '#fbbf24', letterSpacing: '0.08em', textAlign: 'center' }}
        >
          NEW FLAVOR UNTIL EVENLY SPREAD
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
