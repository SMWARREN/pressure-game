// ─── FEATURES CONFIG ─────────────────────────────────────────────────────────
// Enable or disable game modes by editing the list below.
// Changes take effect immediately — no other files need to be edited.
//
// All available mode IDs:
//   Pressure Series: 'classic', 'blitz', 'zen'
//   Arcade:          'candy', 'shoppingSpree', 'gemBlast'
//   Strategy:        'quantum_chain', 'outbreak'
//   Brain:           'memoryMatch'
//   Arcade+:         'gravityDrop', 'mirrorForge'
//   Experimental:    'laserRelay', 'voltage', 'fuse'

export const ENABLED_MODE_IDS: string[] = [
  // ── Pressure Series ──────────────────────────────────────────────────────
  'classic',
  'blitz',
  'zen',

  // ── Arcade ────────────────────────────────────────────────────────────────
  'candy',
  'shoppingSpree',
  // 'gemBlast',

  // ── Experimental ──────────────────────────────────────────────────────────
  'laserRelay',

  // ── Disabled (uncomment to enable) ───────────────────────────────────────
  // 'quantum_chain',
  // 'outbreak',
  // 'memoryMatch',
  // 'gravityDrop',
  // 'mirrorForge',
  // 'voltage',
  // 'fuse',
];
