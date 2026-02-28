// PRESSURE - Shopping Spree Mode Tutorial Demos

import { TutorialDemoType } from '../types';
import { ArcadeTile } from '../shared/arcadeTile';

const SHOPPING_COLORS: Record<string, string> = {
  '👗': '#ec4899',
  '👠': '#ef4444',
  '👜': '#d97706',
  '💄': '#db2777',
  '💎': '#06b6d4',
};

export function renderShoppingSpreeDemo(
  type: TutorialDemoType,
  _modeColor: string
): React.ReactNode | null {
  if (type === 'shopping-group') {
    const grid = [
      ['👗', '👗', '👠'],
      ['👗', '👜', '👜'],
      ['💄', '👜', '💎'],
    ];
    const inGroup = (r: number, c: number) => (r === 0 && c < 2) || (r === 1 && c === 0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {grid.map((row, r) => (
          <div key={r} style={{ display: 'flex', gap: 3 }}>
            {row.map((sym, c) => (
              <ArcadeTile colors={SHOPPING_COLORS} key={c} sym={sym} highlight={inGroup(r, c)} />
            ))}
          </div>
        ))}
        <div
          style={{
            marginTop: 8,
            fontSize: 10,
            color: '#ec4899',
            letterSpacing: '0.1em',
            textAlign: 'center',
          }}
        >
          GROUP OF 3 — TAP TO BUY ALL
        </div>
      </div>
    );
  }

  if (type === 'shopping-values') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <ArcadeTile colors={SHOPPING_COLORS} sym="💄" highlight small />
            <div style={{ fontSize: 9, color: '#db2777' }}>$10</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <ArcadeTile colors={SHOPPING_COLORS} sym="👗" highlight small />
            <div style={{ fontSize: 9, color: '#ec4899' }}>$15</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <ArcadeTile colors={SHOPPING_COLORS} sym="👠" highlight small />
            <div style={{ fontSize: 9, color: '#ef4444' }}>$20</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <ArcadeTile colors={SHOPPING_COLORS} sym="👜" highlight small />
            <div style={{ fontSize: 9, color: '#d97706' }}>$25</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <ArcadeTile colors={SHOPPING_COLORS} sym="💎" highlight small />
            <div style={{ fontSize: 9, color: '#06b6d4' }}>$50</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#f59e0b', letterSpacing: '0.05em' }}>
          💎 DIAMONDS ARE MOST VALUABLE!
        </div>
      </div>
    );
  }

  if (type === 'shopping-flash') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 3 }}>
          <ArcadeTile colors={SHOPPING_COLORS} sym="👗" highlight small />
          <ArcadeTile colors={SHOPPING_COLORS} sym="👗" highlight flashSale small />
          <ArcadeTile colors={SHOPPING_COLORS} sym="👠" small />
        </div>
        <div style={{ fontSize: 10, color: '#fbbf24', letterSpacing: '0.1em', fontWeight: 700 }}>
          ⚡ FLASH SALE: 3× VALUE!
        </div>
      </div>
    );
  }

  if (type === 'shopping-cart') {
    return (
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 24 }}>🛒</div>
          <div style={{ fontSize: 10, color: '#3a3a55' }}>10 items</div>
        </div>
        <div style={{ fontSize: 20, color: '#22c55e' }}>→</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 24, filter: 'drop-shadow(0 0 10px rgba(34,197,94,0.6))' }}>
            💰
          </div>
          <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>+$50 BONUS!</div>
        </div>
      </div>
    );
  }

  if (type === 'shopping-thief') {
    const grid = [
      ['👗', '🦹', '👠'],
      ['👗', '👗', '🦹'],
      ['💄', '👜', '💎'],
    ];
    const inGroup = (r: number, c: number) =>
      (r === 1 && c === 0) || (r === 1 && c === 1) || (r === 0 && c === 0);
    const isThief = (r: number, c: number) => grid[r][c] === '🦹';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {grid.map((row, r) => (
            <div key={r} style={{ display: 'flex', gap: 3 }}>
              {row.map((sym, c) =>
                isThief(r, c) ? (
                  <div
                    key={c}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 7,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      background: 'linear-gradient(145deg, #ef444433, #ef444411)',
                      border: '2px solid #ef444480',
                      boxShadow: '0 0 10px #ef444440',
                    }}
                  >
                    🦹
                  </div>
                ) : (
                  <ArcadeTile
                    colors={SHOPPING_COLORS}
                    key={c}
                    sym={sym}
                    highlight={inGroup(r, c)}
                  />
                )
              )}
            </div>
          ))}
        </div>
        <div
          style={{ fontSize: 10, color: '#ef4444', letterSpacing: '0.1em', textAlign: 'center' }}
        >
          MATCH 3+ NEARBY → SCARE THIEF
        </div>
      </div>
    );
  }

  if (type === 'shopping-unlock') {
    const bonusItems: Array<{ sym: string; price: string }> = [
      { sym: '🎀', price: '$20' },
      { sym: '👒', price: '$25' },
      { sym: '💍', price: '$45' },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {['👗', '👗', '👗'].map((sym, i) => (
                <ArcadeTile colors={SHOPPING_COLORS} key={i} sym={sym} highlight small />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {['👗', '👗'].map((sym, i) => (
                <ArcadeTile colors={SHOPPING_COLORS} key={i} sym={sym} highlight small />
              ))}
            </div>
            <div style={{ fontSize: 9, color: '#ec4899' }}>5+ COMBO</div>
          </div>
          <div style={{ fontSize: 18, color: '#fbbf24' }}>→</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {bonusItems.map(({ sym, price }) => (
                <div
                  key={sym}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      background: 'linear-gradient(145deg, #fbbf2433, #fbbf2411)',
                      border: '2px solid #fbbf24',
                      boxShadow: '0 0 12px #fbbf2470',
                    }}
                  >
                    {sym}
                  </div>
                  <div style={{ fontSize: 9, color: '#fbbf24', fontWeight: 700 }}>{price}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 9, color: '#fbbf24', fontWeight: 700 }}>2× VALUE ✨</div>
          </div>
        </div>
        <div
          style={{ fontSize: 10, color: '#fbbf24', letterSpacing: '0.08em', textAlign: 'center' }}
        >
          NEW ITEM UNTIL EVENLY SPREAD
        </div>
      </div>
    );
  }

  if (type === 'shopping-ready') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['👗', '👠', '👜', '💄', '💎'].map((sym) => {
            const col = SHOPPING_COLORS[sym];
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
        <div style={{ fontSize: 11, color: '#ec4899', letterSpacing: '0.15em', fontWeight: 700 }}>
          SHOP TIL YOU DROP
        </div>
      </div>
    );
  }

  return null;
}
