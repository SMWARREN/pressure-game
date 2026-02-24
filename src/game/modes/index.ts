// PRESSURE - Game Mode Registry
// Add new modes here and they automatically appear in the UI.
// Each mode lives in its own folder so it's fully self-contained and swappable.
//
// GROUPS
// ──────
// Modes are organized into display groups for the mode-selector menu.
// Each group has a label and an ordered list of mode IDs.
// Modes not listed in any group fall into an implicit "Other" bucket.

import { GameModeConfig } from './types';
import { ClassicMode } from './classic/index';
import { ZenMode } from './zen/index';
import { BlitzMode } from './blitz/index';
import { CandyMode } from './candy/index';
import { QuantumChainMode } from './quantumChain/index';
import { ShoppingSpreeMode } from './shoppingSpree/index';
import { OutbreakMode } from './outbreak/index';
import { MemoryMatchMode } from './memoryMatch/index';
import { GravityDropMode } from './gravityDrop/index';
import { MirrorForgeMode } from './mirrorForge/index';

export const GAME_MODES: GameModeConfig[] = [
  ClassicMode,
  ZenMode,
  BlitzMode,
  CandyMode,
  QuantumChainMode,
  ShoppingSpreeMode,
  OutbreakMode,
  MemoryMatchMode,
  GravityDropMode,
  MirrorForgeMode,
];

// ── Mode Groups ───────────────────────────────────────────────────────────────
// Controls how modes are sectioned in the mode-selector modal.

export interface ModeGroup {
  /** Section heading shown above the cards */
  label: string;
  /** Optional one-liner shown below the heading */
  tagline?: string;
  /** Ordered list of mode IDs that belong to this group */
  modeIds: string[];
}

export const MODE_GROUPS: ModeGroup[] = [
  {
    label: 'Pressure Series',
    tagline: 'The original pipe puzzle — three ways to play',
    modeIds: ['classic', 'blitz', 'zen'],
  },
  {
    label: 'Arcade',
    tagline: 'Match, clear, and score',
    modeIds: ['candy', 'shoppingSpree'],
  },
  {
    label: 'Strategy',
    tagline: 'Unique mechanics, deeper thinking',
    modeIds: ['quantum_chain', 'outbreak'],
  },
  {
    label: 'Brain Games',
    tagline: 'Memory, recall, and pattern recognition',
    modeIds: ['memoryMatch'],
  },
  {
    label: 'Arcade+',
    tagline: 'Creative twists on familiar ideas',
    modeIds: ['gravityDrop', 'mirrorForge'],
  },
];

export const DEFAULT_MODE_ID = 'classic';

export function getModeById(id: string): GameModeConfig {
  return GAME_MODES.find((m) => m.id === id) ?? ClassicMode;
}

export {
  ClassicMode,
  ZenMode,
  BlitzMode,
  CandyMode,
  QuantumChainMode,
  ShoppingSpreeMode,
  MemoryMatchMode,
  GravityDropMode,
  MirrorForgeMode,
};
// Export type from local modes/types (not from ../types which re-exports this)
export type { GameModeConfig } from './types';
