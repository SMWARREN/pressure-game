/**
 * Global Constants
 * Centralized values to reduce magic strings and enable easy rebranding
 */

// ─── Storage Keys ────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  USER_ID: 'pressure_user_id',
  ACHIEVEMENTS: 'pressure_achievements_v2',
  DAILY_STREAK: 'pressure_daily_streak_v1',
  LEVEL_ATTEMPTS: 'pressure_level_attempts_v1',
  SAVE_DATA: 'pressure_save_v3',
  WALKTHROUGH: 'pressure_walkthrough_seen',
} as const;

// ─── Game Modes ──────────────────────────────────────────────────────────────

export const GAME_MODES = {
  CLASSIC: 'classic',
  BLITZ: 'blitz',
  ZEN: 'zen',
  CANDY: 'candy',
  SHOPPING_SPREE: 'shoppingSpree',
  GEM_BLAST: 'gemBlast',
  LASER_RELAY: 'laserRelay',
  GRAVITY_DROP: 'gravityDrop',
  FUSE: 'fuse',
} as const;

// ─── Game Status ─────────────────────────────────────────────────────────────

export const GAME_STATUS = {
  TUTORIAL: 'tutorial',
  MENU: 'menu',
  IDLE: 'idle',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
} as const;

// ─── Directions ──────────────────────────────────────────────────────────────

export const DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
} as const;

export type Direction = (typeof DIRECTIONS)[keyof typeof DIRECTIONS];

// ─── Tile Types ──────────────────────────────────────────────────────────────

export const TILE_TYPES = {
  WALL: 'wall',
  PATH: 'path',
  NODE: 'node',
  MIRROR: 'mirror',
  SOURCE: 'source',
  TARGET: 'target',
  OPERATOR: 'operator',
} as const;

// ─── CSS Display Values ──────────────────────────────────────────────────────

export const CSS_DISPLAY = {
  FLEX: 'flex',
  GRID: 'grid',
  BLOCK: 'block',
  INLINE: 'inline',
  INLINE_BLOCK: 'inline-block',
  NONE: 'none',
} as const;

// ─── CSS Position ────────────────────────────────────────────────────────────

export const CSS_POSITION = {
  ABSOLUTE: 'absolute',
  RELATIVE: 'relative',
  FIXED: 'fixed',
  STICKY: 'sticky',
  STATIC: 'static',
} as const;

// ─── CSS Flex Direction ──────────────────────────────────────────────────────

export const CSS_FLEX_DIRECTION = {
  ROW: 'row',
  COLUMN: 'column',
  ROW_REVERSE: 'row-reverse',
  COLUMN_REVERSE: 'column-reverse',
} as const;

// ─── CSS Alignment ───────────────────────────────────────────────────────────

export const CSS_ALIGN = {
  CENTER: 'center',
  FLEX_START: 'flex-start',
  FLEX_END: 'flex-end',
  SPACE_BETWEEN: 'space-between',
  SPACE_AROUND: 'space-around',
} as const;

// ─── Cursor Styles ───────────────────────────────────────────────────────────

export const CURSOR = {
  POINTER: 'pointer',
  DEFAULT: 'default',
  NOT_ALLOWED: 'not-allowed',
  GRAB: 'grab',
  GRABBING: 'grabbing',
} as const;

// ─── Color Opacity Classes ───────────────────────────────────────────────────

export const RGBA_COLORS = {
  TRANSPARENT_BLACK_30: 'rgba(0,0,0,0.3)',
  TRANSPARENT_BLACK_50: 'rgba(0,0,0,0.5)',
  TRANSPARENT_BLACK_60: 'rgba(0,0,0,0.6)',
  TRANSPARENT_WHITE_01: 'rgba(255,255,255,0.01)',
  TRANSPARENT_WHITE_02: 'rgba(255,255,255,0.02)',
  TRANSPARENT_WHITE_04: 'rgba(255,255,255,0.04)',
  TRANSPARENT_WHITE_08: 'rgba(255,255,255,0.08)',

  RED_ERROR: 'rgba(239,68,68,0.5)',
  RED_BG: 'rgba(239,68,68,0.2)',
  AMBER_WARNING: 'rgba(245,158,11,0.4)',
  GREEN_SUCCESS: 'rgba(34,197,94,0.3)',
  GREEN_BG: 'rgba(34,197,94,0.1)',
  GREEN_TILE: 'rgba(34,197,94,0.5)',
  BLUE_INFO: 'rgba(96,165,250,0.4)',
  PURPLE_ACCENT: 'rgba(168,85,247,0.2)',
  INDIGO_BORDER: 'rgba(99,102,241,0.3)',
  RED_DANGER: 'rgba(252,165,165,0.5)',

  DARK_FOOTER: 'rgba(6,6,15,0.85)',
  DARK_OVERLAY: 'rgba(10,10,20,0.95)',
  DARK_TOOLBAR: 'rgba(6,6,15,0.95)',
  LIGHT_OVERLAY: 'rgba(241,245,249,0.95)',
  LIGHT_FOOTER: 'rgba(241,245,249,0.9)',
} as const;
