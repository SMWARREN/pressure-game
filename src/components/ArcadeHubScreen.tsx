// ARCADE HUB SCREEN
// 3-column split layout: Candy | Shopping Spree | Gem Blast
// All three modes visible at once. Tap ℹ on each panel to flip to info.

import { useState } from 'react';
import { useGameStore } from '../game/store';
import { CandyMode } from '../game/modes/candy/index';
import { ShoppingSpreeMode } from '../game/modes/shoppingSpree/index';
import { GemBlastMode } from '../game/modes/gemBlast/index';
import type { Tile } from '../game/types';

// ── Inject keyframes once ─────────────────────────────────────────────────────

let arcadeHubStylesInjected = false;
function ensureArcadeHubStyles() {
  if (arcadeHubStylesInjected || typeof document === 'undefined') return;
  arcadeHubStylesInjected = true;
  const el = document.createElement('style');
  el.textContent = `
    @keyframes arcadeTileFloat {
      0%   { transform: translateY(0px);  }
      50%  { transform: translateY(-5px); }
      100% { transform: translateY(0px);  }
    }
    @keyframes arcadeInfoIn {
      from { opacity: 0; transform: scale(0.97); }
      to   { opacity: 1; transform: scale(1);    }
    }
  `;
  document.head.appendChild(el);
}

// ── Sample symbol sets ────────────────────────────────────────────────────────

const CANDY_SAMPLE = ['🍎', '🍊', '🍋', '🫐', '🍓'];
const SHOPPING_SAMPLE = ['👗', '👠', '👜', '💄', '💎'];
const GEM_SAMPLE = ['💎', '💍', '🔮', '🟣', '🔵'];

// ── Mode metadata ─────────────────────────────────────────────────────────────

interface MechanicRow {
  icon: string;
  label: string;
  detail: string;
}

interface ModeInfo {
  scoreFormula: string;
  scoreNote: string;
  mechanics: MechanicRow[];
  worlds: string;
}

const CANDY_INFO: ModeInfo = {
  scoreFormula: 'n² × 5 pts',
  scoreNote: 'Bigger groups pay off exponentially',
  mechanics: [
    { icon: '🍬', label: 'Tap a group', detail: '2+ matching tiles' },
    { icon: '🧊', label: 'Frozen tiles', detail: 'Clear nearby to thaw' },
    { icon: '⭐', label: 'Wildcards', detail: 'Match any symbol' },
    { icon: '💣', label: 'Bombs', detail: '3×3 explosion + bonus' },
  ],
  worlds: '6 worlds + Tropical chaos',
};

const SHOPPING_INFO: ModeInfo = {
  scoreFormula: 'value × size × ×',
  scoreNote: '5+=2×  ·  7+=3×  ·  10+=4×',
  mechanics: [
    { icon: '💰', label: 'Item values', detail: '💄$10 👗$15 👠$20 👜$25 💎$50' },
    { icon: '⚡', label: 'Flash sales', detail: 'Item goes 3× for 3 taps' },
    { icon: '🛒', label: 'Cart bonus', detail: '10 items cleared = +$50' },
    { icon: '🦹', label: 'Thieves', detail: 'Block tiles in Unlimited' },
  ],
  worlds: '5 worlds + Black Friday',
};

const GEM_INFO: ModeInfo = {
  scoreFormula: 'n² × 8 × cascade',
  scoreNote: 'Cascade multiplier stacks to ×5!',
  mechanics: [
    { icon: '💎', label: 'Tap gems', detail: '2+ matching to clear' },
    { icon: '✨', label: 'Auto-cascade', detail: 'Falling gems auto-clear!' },
    { icon: '💥', label: 'Blast gems', detail: 'Detonates a whole color' },
    { icon: '⏱️', label: 'Timed worlds', detail: 'Diamond Peak & Gem Rush' },
  ],
  worlds: '5 worlds — up to 10×10',
};

// ── Arcade mode definitions ───────────────────────────────────────────────────

type ArcadeModeId = 'candy' | 'shoppingSpree' | 'gemBlast';

interface ArcadeModeDef {
  id: ArcadeModeId;
  title: string;
  tagline: string;
  symbols: string[];
  mode: typeof CandyMode | typeof ShoppingSpreeMode | typeof GemBlastMode;
  info: ModeInfo;
  accentColor: string;
}

const ARCADE_MODES: ArcadeModeDef[] = [
  {
    id: 'candy',
    title: '🍬 Candy',
    tagline: 'Tap groups\nBigger = more!',
    symbols: CANDY_SAMPLE,
    mode: CandyMode,
    info: CANDY_INFO,
    accentColor: '#f472b6',
  },
  {
    id: 'shoppingSpree',
    title: '🛍️ Shop',
    tagline: 'Earn cash\nFlash sales!',
    symbols: SHOPPING_SAMPLE,
    mode: ShoppingSpreeMode,
    info: SHOPPING_INFO,
    accentColor: '#ec4899',
  },
  {
    id: 'gemBlast',
    title: '💎 Gems',
    tagline: 'Chain cascades\nBlast colors!',
    symbols: GEM_SAMPLE,
    mode: GemBlastMode,
    info: GEM_INFO,
    accentColor: '#06b6d4',
  },
];

// ── Fake tile factory ─────────────────────────────────────────────────────────

function makeSampleTiles(symbols: string[]): Tile[] {
  const tiles: Tile[] = [];
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 3; row++) {
      const symbol = symbols[(col * 3 + row) % symbols.length];
      tiles.push({
        id: `sample-${col}-${row}`,
        type: 'path',
        x: col,
        y: row,
        connections: [],
        canRotate: true,
        isGoalNode: false,
        justRotated: false,
        displayData: { symbol, activeSymbols: symbols, isNew: false },
      });
    }
  }
  return tiles;
}

// ── SampleGrid ────────────────────────────────────────────────────────────────

function SampleGrid({
  symbols,
  mode,
  tileSize,
}: {
  symbols: string[];
  mode: typeof CandyMode | typeof ShoppingSpreeMode | typeof GemBlastMode;
  tileSize: number;
}) {
  ensureArcadeHubStyles();
  const tiles = makeSampleTiles(symbols);
  const ctx = {
    isHint: false,
    inDanger: false,
    justRotated: false,
    compressionActive: false,
    tileSize,
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(3, ${tileSize}px)`,
        gridTemplateRows: `repeat(3, ${tileSize}px)`,
        gap: 3,
        justifyContent: 'center',
      }}
    >
      {tiles.map((tile) => {
        const colors = mode.tileRenderer?.getColors?.(tile, ctx) ?? {};
        const symbol = mode.tileRenderer?.getSymbol?.(tile, ctx) ?? null;
        const delay = (tile.x + tile.y) * 0.15;
        return (
          <div
            key={tile.id}
            style={{
              width: tileSize,
              height: tileSize,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: tileSize * 0.48,
              lineHeight: 1,
              animation: `arcadeTileFloat ${1.8 + (tile.x + tile.y) * 0.05}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
              ...colors,
            }}
          >
            {symbol}
          </div>
        );
      })}
    </div>
  );
}

// ── InfoPanel ─────────────────────────────────────────────────────────────────

function InfoPanel({ info, accentColor }: { info: ModeInfo; accentColor: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
        width: '100%',
        animation: 'arcadeInfoIn 0.18s ease-out both',
      }}
    >
      <div
        style={{
          padding: '6px 8px',
          borderRadius: 8,
          background: `${accentColor}14`,
          border: `1px solid ${accentColor}30`,
          textAlign: 'center',
        }}
      >
        <div
          style={{ fontSize: 11, fontWeight: 900, color: accentColor, letterSpacing: '-0.01em' }}
        >
          {info.scoreFormula}
        </div>
        <div style={{ fontSize: 8, color: '#4a4a6a', marginTop: 2, lineHeight: 1.3 }}>
          {info.scoreNote}
        </div>
      </div>

      {info.mechanics.map((m) => (
        <div key={m.label} style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 11, flexShrink: 0, lineHeight: 1.3 }}>{m.icon}</span>
          <div>
            <div style={{ fontSize: 8, fontWeight: 800, color: '#8a8aa8', marginBottom: 1 }}>
              {m.label}
            </div>
            <div style={{ fontSize: 7.5, color: '#3a3a58', lineHeight: 1.35 }}>{m.detail}</div>
          </div>
        </div>
      ))}

      <div
        style={{
          fontSize: 7.5,
          color: '#2a2a45',
          borderTop: '1px solid #12122a',
          paddingTop: 6,
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {info.worlds}
      </div>
    </div>
  );
}

// ── ArcadeColumn — one vertical panel in the 3-way split ─────────────────────

function ArcadeColumn({
  def,
  tileSize,
  showInfo,
  onToggleInfo,
  onPlay,
  hasDividerRight,
}: {
  def: ArcadeModeDef;
  tileSize: number;
  showInfo: boolean;
  onToggleInfo: (e: React.MouseEvent) => void;
  onPlay: () => void;
  hasDividerRight: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '14px 8px',
        cursor: 'pointer',
        position: 'relative',
        background: `${def.accentColor}04`,
        borderRight: hasDividerRight ? '1px solid #12122a' : 'none',
        transition: 'background 0.15s',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onPlay()}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = `${def.accentColor}10`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = `${def.accentColor}04`;
      }}
    >
      {/* ℹ button */}
      <button
        onClick={onToggleInfo}
        aria-label={showInfo ? 'Close info' : 'Show info'}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: `1.5px solid ${showInfo ? def.accentColor + '80' : '#1e1e35'}`,
          background: showInfo ? `${def.accentColor}20` : '#0d0d1e',
          color: showInfo ? def.accentColor : '#3a3a55',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          fontWeight: 900,
          minHeight: 'unset',
          minWidth: 'unset',
          transition: 'all 0.15s',
          zIndex: 2,
        }}
      >
        {showInfo ? '✕' : 'ℹ'}
      </button>

      {/* Content */}
      {showInfo ? (
        <InfoPanel info={def.info} accentColor={def.accentColor} />
      ) : (
        <SampleGrid symbols={def.symbols} mode={def.mode} tileSize={tileSize} />
      )}

      {!showInfo && (
        <>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: def.accentColor,
                letterSpacing: '-0.01em',
                marginBottom: 3,
              }}
            >
              {def.title}
            </div>
            <div style={{ fontSize: 9, color: '#4a4a6a', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
              {def.tagline}
            </div>
          </div>

          <div
            style={{
              padding: '5px 14px',
              borderRadius: 16,
              border: `1.5px solid ${def.accentColor}30`,
              background: `${def.accentColor}12`,
              fontSize: 9,
              fontWeight: 800,
              color: def.accentColor,
              letterSpacing: '0.05em',
            }}
          >
            PLAY
          </div>
        </>
      )}

      {showInfo && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          style={{
            padding: '6px 14px',
            borderRadius: 16,
            border: `1.5px solid ${def.accentColor}40`,
            background: `${def.accentColor}18`,
            fontSize: 9,
            fontWeight: 800,
            color: def.accentColor,
            cursor: 'pointer',
            letterSpacing: '0.05em',
            minHeight: 'unset',
            minWidth: 'unset',
            marginTop: 4,
            flexShrink: 0,
          }}
        >
          PLAY
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ArcadeHubScreen() {
  ensureArcadeHubStyles();
  const setGameMode = useGameStore((s) => s.setGameMode);
  const closeArcadeHub = useGameStore((s) => s.closeArcadeHub);
  const [openInfoId, setOpenInfoId] = useState<ArcadeModeId | null>(null);

  // Tile size: fit 3 columns on screen, each with small padding
  const cardWidth = window.innerWidth / 3;
  const tileSize = Math.min(28, Math.floor((cardWidth - 16) / 4));

  function selectMode(id: string) {
    setGameMode(id);
  }

  function toggleInfo(id: ArcadeModeId, e: React.MouseEvent) {
    e.stopPropagation();
    setOpenInfoId((prev) => (prev === id ? null : id));
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'linear-gradient(180deg, #06060f 0%, #0a0a1a 100%)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px 20px 12px',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <button
          onClick={closeArcadeHub}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1.5px solid #1e1e35',
            background: '#0d0d1e',
            color: '#6366f1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            minHeight: 'unset',
            minWidth: 'unset',
            flexShrink: 0,
          }}
          aria-label="Back"
        >
          ←
        </button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: '0.06em',
              background: 'linear-gradient(90deg, #f472b6, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ARCADE
          </div>
          <div style={{ fontSize: 10, color: '#3a3a55', marginTop: 2 }}>
            Tap ℹ to learn · tap to play
          </div>
        </div>

        <div style={{ width: 36, flexShrink: 0 }} />
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: '#12122a', flexShrink: 0 }} />

      {/* ── 3-column split ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
        }}
      >
        {ARCADE_MODES.map((def, i) => (
          <ArcadeColumn
            key={def.id}
            def={def}
            tileSize={tileSize}
            showInfo={openInfoId === def.id}
            onToggleInfo={(e) => toggleInfo(def.id, e)}
            onPlay={() => selectMode(def.id)}
            hasDividerRight={i < ARCADE_MODES.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
