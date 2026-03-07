// ARCADE HUB SCREEN
// Dynamic N-column split layout based on enabled arcade modes.
// All visible modes shown at once. Tap ℹ on each panel to flip to info.

import { useState, useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useGameStore } from '../game/store';
import { MODE_GROUPS } from '../game/modes/index';
import { CandyMode } from '../game/modes/candy/index';
import { ShoppingSpreeMode } from '../game/modes/shoppingSpree/index';
import { GemBlastMode } from '../game/modes/gemBlast/index';
import { ArcadeColumn, ArcadeModeDef } from './arcade/ArcadeColumn';
import { ArcadeModeInfo } from './hubs/HubTypes';
import { ensureHubStyles } from './hubs/HubStyles';
import { ENABLED_MODE_IDS } from '../config/features';

// ── Mode metadata & symbol sets ────────────────────────────────────────────────

const CANDY_SAMPLE = ['🍎', '🍊', '🍋', '🫐', '🍓'];
const SHOPPING_SAMPLE = ['👗', '👠', '👜', '💄', '💎'];
const GEM_SAMPLE = ['💎', '💍', '🔮', '🟣', '🔵'];

const MODE_DEFS: Record<
  string,
  {
    title: string;
    tagline: string;
    symbols: string[];
    info: ArcadeModeInfo;
    accentColor: string;
    mode: any;
  }
> = {
  candy: {
    title: '🍬 Candy',
    tagline: 'Tap groups\nBigger = more!',
    symbols: CANDY_SAMPLE,
    mode: CandyMode,
    info: {
      scoreFormula: 'n² × 5 pts',
      scoreNote: 'Bigger groups pay off exponentially',
      mechanics: [
        { icon: '🍬', label: 'Tap a group', detail: '2+ matching tiles' },
        { icon: '🧊', label: 'Frozen tiles', detail: 'Clear nearby to thaw' },
        { icon: '⭐', label: 'Wildcards', detail: 'Match any symbol' },
        { icon: '💣', label: 'Bombs', detail: '3×3 explosion + bonus' },
      ],
      worlds: '6 worlds + Tropical chaos',
    },
    accentColor: '#f472b6',
  },
  shoppingSpree: {
    title: '🛍️ Shop',
    tagline: 'Earn cash\nFlash sales!',
    symbols: SHOPPING_SAMPLE,
    mode: ShoppingSpreeMode,
    info: {
      scoreFormula: 'value × size × ×',
      scoreNote: '5+=2×  ·  7+=3×  ·  10+=4×',
      mechanics: [
        { icon: '💰', label: 'Item values', detail: '💄$10 👗$15 👠$20 👜$25 💎$50' },
        { icon: '⚡', label: 'Flash sales', detail: 'Item goes 3× for 3 taps' },
        { icon: '🛒', label: 'Cart bonus', detail: '10 items cleared = +$50' },
        { icon: '🦹', label: 'Thieves', detail: 'Block tiles in Unlimited' },
      ],
      worlds: '5 worlds + Black Friday',
    },
    accentColor: '#ec4899',
  },
  gemBlast: {
    title: '💎 Gems',
    tagline: 'Chain cascades\nBlast colors!',
    symbols: GEM_SAMPLE,
    mode: GemBlastMode,
    info: {
      scoreFormula: 'n² × 3 × cascade',
      scoreNote: '2× → 4× → 7× → 12× — chain for big points!',
      mechanics: [
        { icon: '💎', label: 'Tap gems', detail: '2+ matching to clear' },
        { icon: '✨', label: 'Auto-cascade', detail: 'Falling gems auto-clear at 2×→12×!' },
        { icon: '💥', label: 'Blast gems', detail: 'Detonates nearby color — trigger chains' },
        { icon: '⏱️', label: 'Timed worlds', detail: 'Cascades add time — race the clock' },
      ],
      worlds: '5 worlds — up to 10×12 + final boss',
    },
    accentColor: '#06b6d4',
  },
};

// ── Main component ────────────────────────────────────────────────────────────

export default function ArcadeHubScreen() {
  ensureHubStyles();
  const { colors } = useTheme();
  const setGameMode = useGameStore((s) => s.setGameMode);
  const closeArcadeHub = useGameStore((s) => s.closeArcadeHub);
  const [openInfoId, setOpenInfoId] = useState<string | null>(null);

  // Get arcade modes from MODE_GROUPS (dynamically filtered by enabled modes)
  const arcadeGroup = useMemo(() => MODE_GROUPS.find((g) => g.label === 'Arcade'), []);
  const enabledModeIds = useMemo(
    () => arcadeGroup?.modeIds.filter((id) => ENABLED_MODE_IDS.includes(id)) ?? [],
    [arcadeGroup]
  );

  // Build arcade modes array from enabled IDs
  const arcadeModes: ArcadeModeDef[] = useMemo(
    () =>
      enabledModeIds
        .map((id) => {
          const def = MODE_DEFS[id];
          if (!def) return null;
          return { id, ...def } as ArcadeModeDef;
        })
        .filter((m): m is ArcadeModeDef => m !== null),
    [enabledModeIds]
  );

  // Tile size: fit N columns on screen with better spacing
  const numColumns = Math.max(1, arcadeModes.length);
  const containerPadding = 32; // 16px padding * 2 sides
  const gapTotal = (numColumns - 1) * 12; // 12px gap between columns
  const availableWidth = globalThis.innerWidth - containerPadding - gapTotal;
  const cardWidth = availableWidth / numColumns;
  const tileSize = Math.min(36, Math.floor((cardWidth - 32) / 4));

  function selectMode(id: string) {
    setGameMode(id);
  }

  function toggleInfo(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setOpenInfoId((prev) => (prev === id ? null : id));
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: colors.game.header,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        overscrollBehavior: 'contain',
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
            border: `1.5px solid ${colors.border.secondary}`,
            background: colors.bg.tertiary,
            color: colors.status.info,
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
          <div style={{ fontSize: 10, color: colors.text.tertiary, marginTop: 2 }}>
            Tap ℹ to learn · tap to play
          </div>
        </div>

        <div style={{ width: 36, flexShrink: 0 }} />
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: colors.border.primary, flexShrink: 0 }} />

      {/* ── Dynamic N-column split with better spacing ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          padding: '16px',
          gap: '12px',
          alignItems: 'stretch',
        }}
      >
        {arcadeModes.map((def) => (
          <ArcadeColumn
            key={def.id}
            def={def}
            tileSize={tileSize}
            showInfo={openInfoId === def.id}
            onToggleInfo={(e) => toggleInfo(def.id, e)}
            onPlay={() => selectMode(def.id)}
          />
        ))}
      </div>
    </div>
  );
}
