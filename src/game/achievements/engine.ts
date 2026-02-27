/**
 * Achievement Engine - Manages achievement state, progress, and unlocking
 */

import { Achievement, AchievementProgress, AchievementState, DEFAULT_ACHIEVEMENTS } from './types';

const STORAGE_KEY = 'pressure_achievements_v1';
const STREAK_KEY = 'pressure_daily_streak_v1';

type AchievementSubscriber = () => void;

class AchievementEngine {
  private achievements: Map<string, Achievement> = new Map();
  private state: AchievementState;
  private subscribers: Set<AchievementSubscriber> = new Set();
  private recentlyEarnedQueue: string[] = [];

  constructor() {
    // Load default achievements
    for (const achievement of DEFAULT_ACHIEVEMENTS) {
      this.achievements.set(achievement.id, achievement);
    }

    // Load state from storage
    this.state = this.loadState();
  }

  private loadState(): AchievementState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          progress: parsed.progress || {},
          totalPoints: parsed.totalPoints || 0,
          recentlyEarned: [],
          stats: parsed.stats || {
            totalLevelsCompleted: 0,
            totalSpeedruns: 0,
            totalMovesUnderPar: 0,
            totalWallsSurvived: 0,
            totalNoHintsLevels: 0,
          },
        };
      }
    } catch (e) {
      console.warn('Failed to load achievements:', e);
    }

    return {
      progress: {},
      totalPoints: 0,
      recentlyEarned: [],
      stats: {
        totalLevelsCompleted: 0,
        totalSpeedruns: 0,
        totalMovesUnderPar: 0,
        totalWallsSurvived: 0,
        totalNoHintsLevels: 0,
      },
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          progress: this.state.progress,
          totalPoints: this.state.totalPoints,
          stats: this.state.stats,
        })
      );
    } catch (e) {
      console.warn('Failed to save achievements:', e);
    }
  }

  private notifySubscribers(): void {
    for (const sub of this.subscribers) {
      sub();
    }
  }

  /**
   * Subscribe to achievement updates
   */
  subscribe(callback: AchievementSubscriber): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Get all achievements
   */
  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  /**
   * Get achievement by ID
   */
  getAchievement(id: string): Achievement | undefined {
    return this.achievements.get(id);
  }

  /**
   * Get progress for an achievement
   */
  getProgress(achievementId: string): AchievementProgress | undefined {
    return this.state.progress[achievementId];
  }

  /**
   * Get all earned achievements
   */
  getEarnedAchievements(): Achievement[] {
    return this.getAllAchievements().filter((a) => this.state.progress[a.id]?.earned);
  }

  /**
   * Get total points earned
   */
  getTotalPoints(): number {
    return this.state.totalPoints;
  }

  /**
   * Get recently earned achievements (for toast notifications)
   */
  getRecentlyEarned(): string[] {
    const recent = [...this.recentlyEarnedQueue];
    this.recentlyEarnedQueue = [];
    return recent;
  }

  /**
   * Update progress for an achievement
   */
  updateProgress(achievementId: string, current: number): boolean {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return false;

    const existing = this.state.progress[achievementId];
    if (existing?.earned) return false; // Already earned

    const target = achievement.condition.target ?? 1;
    const earned = current >= target;

    this.state.progress[achievementId] = {
      achievementId,
      current,
      target,
      earned,
      earnedAt: earned ? Date.now() : undefined,
    };

    if (earned && !existing?.earned) {
      // Newly earned!
      this.state.totalPoints += achievement.points;
      this.recentlyEarnedQueue.push(achievementId);
      this.saveState();
      this.notifySubscribers();
      return true;
    }

    this.saveState();
    return false;
  }

  /**
   * Check and update achievements based on game stats
   * @param stats Stats from the current game session (1 for each if achieved this session)
   */
  checkAchievements(stats: {
    levelsCompleted: number;
    movesUnderPar: number;
    speedruns: number;
    currentStreak: number;
    noHintsLevels: number;
    perfectWorlds: number;
    wallsSurvived: number;
    currentModeId: string;
    currentLevelId: number | null;
  }): string[] {
    const newlyEarned: string[] = [];

    // Update cumulative stats
    this.state.stats.totalLevelsCompleted += stats.levelsCompleted;
    this.state.stats.totalMovesUnderPar += stats.movesUnderPar;
    this.state.stats.totalSpeedruns += stats.speedruns;
    this.state.stats.totalWallsSurvived += stats.wallsSurvived;
    this.state.stats.totalNoHintsLevels += stats.noHintsLevels;

    for (const achievement of this.achievements.values()) {
      const existing = this.state.progress[achievement.id];
      if (existing?.earned) continue;

      // Check if this achievement is restricted to a specific mode/level
      if (achievement.condition.modeId && achievement.condition.modeId !== stats.currentModeId) {
        continue;
      }
      if (achievement.condition.levelId && achievement.condition.levelId !== stats.currentLevelId) {
        continue;
      }

      let current = 0;
      switch (achievement.condition.type) {
        case 'levels_completed':
          current = this.state.stats.totalLevelsCompleted;
          break;
        case 'moves_under_par':
          current = this.state.stats.totalMovesUnderPar;
          break;
        case 'speedrun':
          current = this.state.stats.totalSpeedruns;
          break;
        case 'streak':
          current = stats.currentStreak; // Streak is not cumulative
          break;
        case 'no_hints':
          current = this.state.stats.totalNoHintsLevels;
          break;
        case 'perfect_world':
          current = stats.perfectWorlds; // Perfect world is not cumulative
          break;
        case 'survive_walls':
          current = this.state.stats.totalWallsSurvived;
          break;
        case 'custom':
          // Custom checks are handled separately
          continue;
      }

      if (this.updateProgress(achievement.id, current)) {
        newlyEarned.push(achievement.id);
      }
    }

    this.saveState();
    return newlyEarned;
  }

  /**
   * Check custom achievement conditions
   */
  checkCustomAchievement(checkId: string, data: Record<string, unknown>): boolean {
    const achievement = Array.from(this.achievements.values()).find(
      (a) => a.condition.type === 'custom' && a.condition.customCheck === checkId
    );

    if (!achievement) return false;

    const existing = this.state.progress[achievement.id];
    if (existing?.earned) return false;

    // Custom check logic based on checkId
    let earned = false;
    switch (checkId) {
      case 'zen_complete':
        earned = data.allZenLevelsComplete === true;
        break;
      case 'blitz_complete':
        earned = data.allBlitzLevelsComplete === true;
        break;
    }

    if (earned) {
      this.state.progress[achievement.id] = {
        achievementId: achievement.id,
        current: 1,
        target: 1,
        earned: true,
        earnedAt: Date.now(),
      };
      this.state.totalPoints += achievement.points;
      this.recentlyEarnedQueue.push(achievement.id);
      this.saveState();
      this.notifySubscribers();
      return true;
    }

    return false;
  }

  /**
   * Add a custom achievement (for level-specific achievements)
   */
  addAchievement(achievement: Achievement): void {
    this.achievements.set(achievement.id, achievement);
  }

  /**
   * Remove an achievement
   */
  removeAchievement(id: string): void {
    this.achievements.delete(id);
  }

  /**
   * Reset all achievements (for testing)
   */
  reset(): void {
    this.state = {
      progress: {},
      totalPoints: 0,
      recentlyEarned: [],
      stats: {
        totalLevelsCompleted: 0,
        totalSpeedruns: 0,
        totalMovesUnderPar: 0,
        totalWallsSurvived: 0,
        totalNoHintsLevels: 0,
      },
    };
    this.recentlyEarnedQueue = [];
    this.saveState();
    this.notifySubscribers();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     DAILY STREAK TRACKING
  ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get current daily streak data
   */
  getStreakData(): { currentStreak: number; lastPlayDate: string | null } {
    try {
      const saved = localStorage.getItem(STREAK_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load streak data:', e);
    }
    return { currentStreak: 0, lastPlayDate: null };
  }

  /**
   * Update streak when the player plays the game.
   * Call this once per day when the app launches or a game is played.
   * Returns the updated streak count.
   */
  updateDailyStreak(): number {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const streakData = this.getStreakData();

    if (streakData.lastPlayDate === today) {
      // Already played today, no change
      return streakData.currentStreak;
    }

    let newStreak = 1;

    if (streakData.lastPlayDate) {
      const lastDate = new Date(streakData.lastPlayDate);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day - increment streak
        newStreak = streakData.currentStreak + 1;
      } else if (diffDays > 1) {
        // Streak broken - start over
        newStreak = 1;
      }
      // diffDays === 0 means same day (shouldn't happen due to check above)
    }

    // Save updated streak
    const newData = { currentStreak: newStreak, lastPlayDate: today };
    try {
      localStorage.setItem(STREAK_KEY, JSON.stringify(newData));
    } catch (e) {
      console.warn('Failed to save streak data:', e);
    }

    return newStreak;
  }

  /**
   * Get the current streak without updating it
   */
  getCurrentStreak(): number {
    const streakData = this.getStreakData();
    
    // Check if streak is still valid (not broken)
    if (streakData.lastPlayDate) {
      const lastDate = new Date(streakData.lastPlayDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      lastDate.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // If more than 1 day has passed, streak is broken
      if (diffDays > 1) {
        return 0;
      }
    }
    
    return streakData.currentStreak;
  }
}

// Singleton instance
let instance: AchievementEngine | null = null;

export function getAchievementEngine(): AchievementEngine {
  if (!instance) {
    instance = new AchievementEngine();
  }
  return instance;
}

export { AchievementEngine };
