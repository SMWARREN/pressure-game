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
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  category: AchievementCategory;
  /** Points awarded for earning this achievement */
  points: number;
  /** Whether this achievement is hidden until earned */
  hidden?: boolean;
  /** Condition to check if achievement is earned */
  condition: AchievementCondition;
}

export interface AchievementCondition {
  type:
    | 'levels_completed'
    | 'moves_under_par'
    | 'speedrun'
    | 'streak'
    | 'no_hints'
    | 'perfect_world'
    | 'survive_walls'
    | 'custom';
  /** Target value to reach */
  target?: number;
  /** Level ID to restrict to (optional) */
  levelId?: number;
  /** World ID to restrict to (optional) */
  worldId?: number;
  /** Mode ID to restrict to (optional) */
  modeId?: string;
  /** Custom condition function name */
  customCheck?: string;
}

export interface AchievementProgress {
  achievementId: string;
  current: number;
  target: number;
  earned: boolean;
  earnedAt?: number;
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
  };
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

  // ─── Skill ──────────────────────────────────────────────────────────────
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
    description: 'Complete 25 levels without using hints',
    icon: '🧠',
    rarity: 'uncommon',
    category: 'skill',
    points: 40,
    condition: { type: 'no_hints', target: 25 },
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

  // ─── Dedication ─────────────────────────────────────────────────────────
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

  // ─── Special ────────────────────────────────────────────────────────────
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
  {
    id: 'zen_master',
    name: 'Zen Master',
    description: 'Complete all Zen mode levels',
    icon: '🧘',
    rarity: 'legendary',
    category: 'special',
    points: 150,
    hidden: true,
    condition: { type: 'custom', customCheck: 'zen_complete' },
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
    condition: { type: 'custom', customCheck: 'blitz_complete' },
  },
];

/**
 * Level-specific achievements (configurable per level)
 */
export interface LevelAchievementConfig {
  levelId: number;
  achievements: Achievement[];
}

/**
 * Get achievements for a specific level
 */
export function getLevelAchievements(_levelId: number): Achievement[] {
  // Level-specific achievements can be defined here
  // For now, return empty array - these would be configured per level
  return [];
}
