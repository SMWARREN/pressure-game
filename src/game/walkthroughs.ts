// PRESSURE - Walkthrough Registry
// Imports walkthrough configurations from each game mode.

import { WalkthroughConfig } from '../components/WalkthroughOverlay';

// Import walkthroughs from each mode
import { CLASSIC_WALKTHROUGH } from './modes/classic/walkthrough';
import { BLITZ_WALKTHROUGH } from './modes/blitz/walkthrough';
import { ZEN_WALKTHROUGH } from './modes/zen/walkthrough';
import { CANDY_WALKTHROUGH } from './modes/candy/walkthrough';
import { OUTBREAK_WALKTHROUGH } from './modes/outbreak/walkthrough';
import { QUANTUM_CHAIN_WALKTHROUGH } from './modes/quantumChain/walkthrough';
import { SHOPPING_SPREE_WALKTHROUGH } from './modes/shoppingSpree/walkthrough';
import { MEMORY_MATCH_WALKTHROUGH } from './modes/memoryMatch/walkthrough';
import { GRAVITY_DROP_WALKTHROUGH } from './modes/gravityDrop/walkthrough';
import { MIRROR_FORGE_WALKTHROUGH } from './modes/mirrorForge/walkthrough';

/* ═══════════════════════════════════════════════════════════════════════════
   WALKTHROUGH REGISTRY
   Export all walkthroughs for easy lookup
═══════════════════════════════════════════════════════════════════════════ */

export const WALKTHROUGHS: Record<string, WalkthroughConfig> = {
  classic: CLASSIC_WALKTHROUGH,
  blitz: BLITZ_WALKTHROUGH,
  zen: ZEN_WALKTHROUGH,
  candy: CANDY_WALKTHROUGH,
  outbreak: OUTBREAK_WALKTHROUGH,
  quantum_chain: QUANTUM_CHAIN_WALKTHROUGH,
  shopping_spree: SHOPPING_SPREE_WALKTHROUGH,
  memory_match: MEMORY_MATCH_WALKTHROUGH,
  gravity_drop: GRAVITY_DROP_WALKTHROUGH,
  mirror_forge: MIRROR_FORGE_WALKTHROUGH,
};

/**
 * Get the walkthrough config for a specific mode and level.
 * Returns null if no walkthrough is defined.
 */
export function getWalkthrough(modeId: string, levelId: number): WalkthroughConfig | null {
  const config = WALKTHROUGHS[modeId];
  if (!config || config.levelId !== levelId) return null;
  return config;
}

/**
 * Check if a mode has a walkthrough for a specific level.
 */
export function hasWalkthrough(modeId: string, levelId: number): boolean {
  const config = WALKTHROUGHS[modeId];
  return config?.levelId === levelId;
}
