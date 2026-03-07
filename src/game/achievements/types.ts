/**
 * Achievement Types - Definitions for the achievement system
 */

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type AchievementCategory =
  | 'progression' // Complete levels/worlds
  | 'skill' // Performance-based
  | 'dedication' // Time/play count
  | 'special'; // Hidden/unique

export interface Achievement {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly rarity: AchievementRarity;
  readonly category: AchievementCategory;
  /** Points awarded for earning this achievement */
  readonly points: number;
  /** Whether this achievement is hidden until earned */
  readonly hidden?: boolean;
  /** Condition to check if achievement is earned */
  readonly condition: AchievementCondition;
}

export interface AchievementCondition {
  readonly type:
    | 'levels_completed'
    | 'moves_under_par'
    | 'speedrun'
    | 'streak'
    | 'no_hints'
    | 'perfect_world'
    | 'survive_walls'
    | 'world_complete'
    | 'mode_complete'
    | 'combo'
    | 'perfect_level'
    | 'speed_level'
    | 'no_reset'
    | 'total_days'
    | 'total_hours'
    | 'custom';
  /** Target value to reach */
  readonly target?: number;
  /** Level ID to restrict to (optional) */
  readonly levelId?: number;
  /** World ID to restrict to (optional) */
  readonly worldId?: number;
  /** Mode ID to restrict to (optional) */
  readonly modeId?: string;
  /** Custom condition function name */
  readonly customCheck?: string;
}

export interface AchievementProgress {
  readonly achievementId: string;
  readonly current: number;
  readonly target: number;
  readonly earned: boolean;
  readonly earnedAt?: number;
}

export interface SessionStats {
  /** Number of levels completed in this session */
  levelsCompleted: number;
  /** Number of moves under par in this session */
  movesUnderPar: number;
  /** Number of speedruns in this session */
  speedruns: number;
  /** Current streak */
  currentStreak: number;
  /** Number of levels completed without hints */
  noHintsLevels: number;
  /** Number of worlds completed */
  perfectWorlds: number;
  /** Number of walls survived */
  wallsSurvived: number;
  /** Current mode ID */
  currentModeId: string;
  /** Current level ID */
  currentLevelId: number | null;
  /** Current world ID */
  currentWorldId: number | null;
  /** Current combo (optional) */
  combo?: number;
  /** Whether this level was completed perfectly (optional) */
  perfectLevel?: boolean;
  /** Whether this was a speed level (optional) */
  speedLevel?: boolean;
  /** Whether level was restarted (optional) */
  levelRestarted?: boolean;
}

export interface AchievementState {
  /** All achievement progress */
  progress: Record<string, AchievementProgress>;
  /** Total points earned */
  totalPoints: number;
  /** Recently earned achievements (for toast notifications) */
  recentlyEarned: string[];
  /** Cumulative stats for tracking */
  stats: {
    totalLevelsCompleted: number;
    totalSpeedruns: number;
    totalMovesUnderPar: number;
    totalWallsSurvived: number;
    totalNoHintsLevels: number;
    maxCombo: number;
    perfectLevels: number;
    speedLevels: number;
    noResetStreak: number;
    totalDaysPlayed: number;
    totalHoursPlayed: number;
  };
  /** Track which levels have been completed (to avoid double-counting) */
  completedLevelKeys?: Record<string, boolean>;
  /** Track which worlds have been completed per mode */
  completedWorlds?: Record<string, Set<number>>;
  /** Track which modes have been fully completed */
  completedModes?: Set<string>;
  /** Track consecutive levels without restart */
  currentNoResetStreak?: number;
}

/**
 * Default achievements for PRESSURE
 */
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  // ─── Progression ────────────────────────────────────────────────────────
  {
    id: 'first_win',
    name: 'First Connection',
    description: 'Complete your first level',
    icon: '🎉',
    rarity: 'common',
    category: 'progression',
    points: 10,
    condition: { type: 'levels_completed', target: 1 },
  },
  {
    id: 'ten_levels',
    name: 'Getting Started',
    description: 'Complete 10 levels',
    icon: '🚀',
    rarity: 'common',
    category: 'progression',
    points: 25,
    condition: { type: 'levels_completed', target: 10 },
  },
  {
    id: 'fifty_levels',
    name: 'Puzzle Enthusiast',
    description: 'Complete 50 levels',
    icon: '🧩',
    rarity: 'uncommon',
    category: 'progression',
    points: 50,
    condition: { type: 'levels_completed', target: 50 },
  },
  {
    id: 'hundred_levels',
    name: 'Puzzle Master',
    description: 'Complete 100 levels',
    icon: '👑',
    rarity: 'rare',
    category: 'progression',
    points: 100,
    condition: { type: 'levels_completed', target: 100 },
  },

  // ─── World-Based Achievements ───────────────────────────────────────────
  {
    id: 'world_1_champion',
    name: 'World 1 Champion',
    description: 'Complete all World 1 levels',
    icon: '🌍',
    rarity: 'common',
    category: 'progression',
    points: 25,
    condition: { type: 'world_complete', worldId: 1 },
  },
  {
    id: 'world_2_explorer',
    name: 'World 2 Explorer',
    description: 'Complete all World 2 levels',
    icon: '🌎',
    rarity: 'common',
    category: 'progression',
    points: 30,
    condition: { type: 'world_complete', worldId: 2 },
  },
  {
    id: 'world_3_master',
    name: 'World 3 Master',
    description: 'Complete all World 3 levels',
    icon: '🌏',
    rarity: 'uncommon',
    category: 'progression',
    points: 40,
    condition: { type: 'world_complete', worldId: 3 },
  },
  {
    id: 'world_4_legend',
    name: 'World 4 Legend',
    description: 'Complete all World 4 levels',
    icon: '🗺️',
    rarity: 'uncommon',
    category: 'progression',
    points: 50,
    condition: { type: 'world_complete', worldId: 4 },
  },
  {
    id: 'world_5_hero',
    name: 'World 5 Hero',
    description: 'Complete all World 5 levels',
    icon: '🧭',
    rarity: 'rare',
    category: 'progression',
    points: 60,
    condition: { type: 'world_complete', worldId: 5 },
  },
  {
    id: 'world_6_champion',
    name: 'World 6 Champion',
    description: 'Complete all World 6 levels',
    icon: '🏔️',
    rarity: 'rare',
    category: 'progression',
    points: 70,
    condition: { type: 'world_complete', worldId: 6 },
  },
  {
    id: 'world_7_master',
    name: 'World 7 Master',
    description: 'Complete all World 7 levels',
    icon: '🌋',
    rarity: 'rare',
    category: 'progression',
    points: 80,
    condition: { type: 'world_complete', worldId: 7 },
  },
  {
    id: 'all_worlds_complete',
    name: 'All Worlds Complete',
    description: 'Complete every world in the game',
    icon: '🏆',
    rarity: 'legendary',
    category: 'progression',
    points: 200,
    hidden: true,
    condition: { type: 'custom', customCheck: 'all_worlds_complete' },
  },

  // ─── Mode-Based Achievements ────────────────────────────────────────────
  {
    id: 'classic_champion',
    name: 'Classic Champion',
    description: 'Complete all Classic mode levels',
    icon: '⚡',
    rarity: 'rare',
    category: 'progression',
    points: 100,
    condition: { type: 'mode_complete', modeId: 'classic' },
  },
  {
    id: 'zen_master',
    name: 'Zen Master',
    description: 'Complete all Zen mode levels',
    icon: '🧘',
    rarity: 'legendary',
    category: 'special',
    points: 150,
    hidden: true,
    condition: { type: 'mode_complete', modeId: 'zen' },
  },
  {
    id: 'blitz_survivor',
    name: 'Blitz Survivor',
    description: 'Complete all Blitz mode levels',
    icon: '🔥',
    rarity: 'legendary',
    category: 'special',
    points: 150,
    hidden: true,
    condition: { type: 'mode_complete', modeId: 'blitz' },
  },
  {
    id: 'laser_legend',
    name: 'Laser Legend',
    description: 'Complete all Laser Relay levels',
    icon: '🔦',
    rarity: 'rare',
    category: 'progression',
    points: 100,
    condition: { type: 'mode_complete', modeId: 'laserRelay' },
  },
  {
    id: 'memory_master',
    name: 'Memory Master',
    description: 'Complete all Memory Match levels',
    icon: '🧠',
    rarity: 'rare',
    category: 'progression',
    points: 100,
    condition: { type: 'mode_complete', modeId: 'memoryMatch' },
  },
  {
    id: 'gravity_champion',
    name: 'Gravity Champion',
    description: 'Complete all Gravity Drop levels',
    icon: '⬇️',
    rarity: 'rare',
    category: 'progression',
    points: 100,
    condition: { type: 'mode_complete', modeId: 'gravityDrop' },
  },
  {
    id: 'voltage_victor',
    name: 'Voltage Victor',
    description: 'Complete all Voltage levels',
    icon: '⚡',
    rarity: 'rare',
    category: 'progression',
    points: 100,
    condition: { type: 'mode_complete', modeId: 'voltage' },
  },
  {
    id: 'outbreak_survivor',
    name: 'Outbreak Survivor',
    description: 'Complete all Outbreak levels',
    icon: '🦠',
    rarity: 'rare',
    category: 'progression',
    points: 100,
    condition: { type: 'mode_complete', modeId: 'outbreak' },
  },
  {
    id: 'quantum_master',
    name: 'Quantum Master',
    description: 'Complete all Quantum Chain levels',
    icon: '⚛️',
    rarity: 'rare',
    category: 'progression',
    points: 100,
    condition: { type: 'mode_complete', modeId: 'quantum_chain' },
  },
  {
    id: 'mirror_master',
    name: 'Mirror Master',
    description: 'Complete all Mirror Forge levels',
    icon: '🪞',
    rarity: 'rare',
    category: 'progression',
    points: 100,
    condition: { type: 'mode_complete', modeId: 'mirrorForge' },
  },
  {
    id: 'gem_collector',
    name: 'Gem Collector',
    description: 'Complete all Gem Blast levels',
    icon: '💎',
    rarity: 'rare',
    category: 'progression',
    points: 100,
    condition: { type: 'mode_complete', modeId: 'gemBlast' },
  },
  {
    id: 'shopping_spree',
    name: 'Shopping Spree',
    description: 'Complete all Shopping Spree levels',
    icon: '🛒',
    rarity: 'rare',
    category: 'progression',
    points: 100,
    condition: { type: 'mode_complete', modeId: 'shoppingSpree' },
  },
  {
    id: 'candy_crusher',
    name: 'Candy Crusher',
    description: 'Complete all Candy levels',
    icon: '🍬',
    rarity: 'rare',
    category: 'progression',
    points: 100,
    condition: { type: 'mode_complete', modeId: 'candy' },
  },
  {
    id: 'fuse_master',
    name: 'Fuse Master',
    description: 'Complete all Fuse levels',
    icon: '🧨',
    rarity: 'rare',
    category: 'progression',
    points: 100,
    condition: { type: 'mode_complete', modeId: 'fuse' },
  },

  // ─── Skill Achievements ──────────────────────────────────────────────────
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Solve 10 levels under par time',
    icon: '⚡',
    rarity: 'uncommon',
    category: 'skill',
    points: 50,
    condition: { type: 'moves_under_par', target: 10 },
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete a world with all gold stars',
    icon: '⭐',
    rarity: 'rare',
    category: 'skill',
    points: 75,
    condition: { type: 'perfect_world', target: 1 },
  },
  {
    id: 'no_hints',
    name: 'No Help Needed',
    description: 'Complete 50 levels without using hints',
    icon: '🧠',
    rarity: 'uncommon',
    category: 'skill',
    points: 50,
    condition: { type: 'no_hints', target: 50 },
  },
  {
    id: 'speedrun',
    name: 'Speedrunner',
    description: 'Complete 10 levels in under 10 seconds each',
    icon: '🏃',
    rarity: 'rare',
    category: 'skill',
    points: 60,
    condition: { type: 'speedrun', target: 10 },
  },
  {
    id: 'combo_king',
    name: 'Combo King',
    description: 'Achieve a 10x combo in one game',
    icon: '🔥',
    rarity: 'rare',
    category: 'skill',
    points: 75,
    condition: { type: 'combo', target: 10 },
  },
  {
    id: 'perfect_game',
    name: 'Perfect Game',
    description: 'Complete a level without any mistakes',
    icon: '✨',
    rarity: 'uncommon',
    category: 'skill',
    points: 40,
    condition: { type: 'perfect_level', target: 1 },
  },
  {
    id: 'speed_level',
    name: 'Lightning Fast',
    description: 'Complete a level in under 5 seconds',
    icon: '⚡',
    rarity: 'uncommon',
    category: 'skill',
    points: 35,
    condition: { type: 'speed_level', target: 1 },
  },
  {
    id: 'wall_survivor',
    name: 'Wall Survivor',
    description: 'Survive 100 wall compressions',
    icon: '🛡️',
    rarity: 'rare',
    category: 'skill',
    points: 60,
    condition: { type: 'survive_walls', target: 100 },
  },
  {
    id: 'no_reset',
    name: 'No Reset',
    description: 'Complete 10 levels without restarting',
    icon: '🎯',
    rarity: 'uncommon',
    category: 'skill',
    points: 45,
    condition: { type: 'no_reset', target: 10 },
  },

  // ─── Dedication Achievements ─────────────────────────────────────────────
  {
    id: 'daily_player',
    name: 'Daily Player',
    description: 'Play for 30 days total',
    icon: '📅',
    rarity: 'uncommon',
    category: 'dedication',
    points: 50,
    condition: { type: 'total_days', target: 30 },
  },
  {
    id: 'daily_streak_7',
    name: 'Week Warrior',
    description: 'Play 7 days in a row',
    icon: '📅',
    rarity: 'uncommon',
    category: 'dedication',
    points: 30,
    condition: { type: 'streak', target: 7 },
  },
  {
    id: 'daily_streak_30',
    name: 'Monthly Master',
    description: 'Play 30 days in a row',
    icon: '🗓️',
    rarity: 'rare',
    category: 'dedication',
    points: 100,
    condition: { type: 'streak', target: 30 },
  },
  {
    id: 'year_long',
    name: 'Year Long',
    description: 'Play for 365 days total',
    icon: '📆',
    rarity: 'legendary',
    category: 'dedication',
    points: 200,
    condition: { type: 'total_days', target: 365 },
  },
  {
    id: 'marathon',
    name: 'Marathon',
    description: 'Play for 100 hours total',
    icon: '⏱️',
    rarity: 'legendary',
    category: 'dedication',
    points: 150,
    condition: { type: 'total_hours', target: 100 },
  },

  // ─── Secret Achievements ─────────────────────────────────────────────────
  {
    id: 'first_try',
    name: 'First Try',
    description: 'Attempt a level 10 times before completing',
    icon: '🎲',
    rarity: 'uncommon',
    category: 'special',
    points: 30,
    hidden: true,
    condition: { type: 'custom', customCheck: 'first_try' },
  },
  {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Win after being at 0% progress',
    icon: '💪',
    rarity: 'rare',
    category: 'special',
    points: 50,
    hidden: true,
    condition: { type: 'custom', customCheck: 'comeback_kid' },
  },
  {
    id: 'perfect_streak',
    name: 'Perfect Streak',
    description: 'Complete 5 levels in a row without any mistakes',
    icon: '🌟',
    rarity: 'rare',
    category: 'special',
    points: 75,
    hidden: true,
    condition: { type: 'custom', customCheck: 'perfect_streak' },
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Play between midnight and 4 AM',
    icon: '🦉',
    rarity: 'uncommon',
    category: 'special',
    points: 25,
    hidden: true,
    condition: { type: 'custom', customCheck: 'night_owl' },
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Play before 6 AM',
    icon: '🐦',
    rarity: 'uncommon',
    category: 'special',
    points: 25,
    hidden: true,
    condition: { type: 'custom', customCheck: 'early_bird' },
  },

  // ─── Legacy (keeping for backwards compatibility) ────────────────────────
  {
    id: 'survivor',
    name: 'Survivor',
    description: 'Survive 50 wall compressions',
    icon: '🛡️',
    rarity: 'uncommon',
    category: 'special',
    points: 35,
    condition: { type: 'survive_walls', target: 50 },
  },
];

/**
 * Level-specific achievements (configurable per level)
 */
export interface LevelAchievementConfig {
  readonly levelId: number;
  readonly achievements: Achievement[];
}

/**
 * Get achievements for a specific level
 */
export function getLevelAchievements(_levelId: number): Achievement[] {
  // Level-specific achievements can be defined here
  // For now, return empty array - these would be configured per level
  return [];
}
