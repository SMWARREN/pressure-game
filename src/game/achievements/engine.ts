/**
 * Achievement Engine - Manages achievement state, progress, and unlocking
 */

import {
  Achievement,
  AchievementProgress,
  AchievementState,
  SessionStats,
  DEFAULT_ACHIEVEMENTS,
} from './types';
import { unlockAchievement, updateUserStats } from '../api/leaderboards';
import { getModeById } from '../modes';
import { STORAGE_KEYS } from '@/utils/constants';

type AchievementSubscriber = () => void;

/** Default stats structure */
const DEFAULT_STATS = {
  totalLevelsCompleted: 0,
  totalSpeedruns: 0,
  totalMovesUnderPar: 0,
  totalWallsSurvived: 0,
  totalNoHintsLevels: 0,
  maxCombo: 0,
  perfectLevels: 0,
  speedLevels: 0,
  noResetStreak: 0,
  totalDaysPlayed: 0,
  totalHoursPlayed: 0,
};

class AchievementEngine {
  private readonly achievements: Map<string, Achievement> = new Map();
  private state: AchievementState;
  private readonly subscribers: Set<AchievementSubscriber> = new Set();
  private recentlyEarnedQueue: string[] = [];
  private sessionStartTime: number = Date.now();
  private levelAttempts: Record<string, number> = {};
  private perfectStreak: number = 0;

  constructor() {
    // Load default achievements
    for (const achievement of DEFAULT_ACHIEVEMENTS) {
      this.achievements.set(achievement.id, achievement);
    }

    // Load state from storage
    this.state = this.loadState();
    this.loadLevelAttempts();
    console.log('[AchievementEngine] Initialized with', this.achievements.size, 'achievements');
  }

  private loadState(): AchievementState {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          progress: parsed.progress || {},
          totalPoints: parsed.totalPoints || 0,
          recentlyEarned: [],
          stats: { ...DEFAULT_STATS, ...parsed.stats },
          completedLevelKeys: parsed.completedLevelKeys || {},
          completedWorlds: parsed.completedWorlds
            ? this.deserializeCompletedWorlds(parsed.completedWorlds)
            : undefined,
          completedModes: parsed.completedModes ? new Set(parsed.completedModes) : undefined,
          currentNoResetStreak: parsed.currentNoResetStreak || 0,
        };
      }
    } catch (e) {
      console.warn('Failed to load achievements:', e);
    }

    return {
      progress: {},
      totalPoints: 0,
      recentlyEarned: [],
      stats: { ...DEFAULT_STATS },
    };
  }

  private deserializeCompletedWorlds(data: Record<string, number[]>): Record<string, Set<number>> {
    const result: Record<string, Set<number>> = {};
    for (const [modeId, worlds] of Object.entries(data)) {
      result[modeId] = new Set(worlds);
    }
    return result;
  }

  private serializeCompletedWorlds(
    data: Record<string, Set<number>> | undefined
  ): Record<string, number[]> | undefined {
    if (!data) return undefined;
    const result: Record<string, number[]> = {};
    for (const [modeId, worlds] of Object.entries(data)) {
      result[modeId] = Array.from(worlds);
    }
    return result;
  }

  private saveState(): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.ACHIEVEMENTS,
        JSON.stringify({
          progress: this.state.progress,
          totalPoints: this.state.totalPoints,
          stats: this.state.stats,
          completedLevelKeys: this.state.completedLevelKeys,
          completedWorlds: this.serializeCompletedWorlds(this.state.completedWorlds),
          completedModes: this.state.completedModes
            ? Array.from(this.state.completedModes)
            : undefined,
          currentNoResetStreak: this.state.currentNoResetStreak,
        })
      );
    } catch (e) {
      console.warn('Failed to save achievements:', e);
    }
  }

  private loadLevelAttempts(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LEVEL_ATTEMPTS);
      if (saved) {
        this.levelAttempts = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load level attempts:', e);
    }
  }

  private saveLevelAttempts(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LEVEL_ATTEMPTS, JSON.stringify(this.levelAttempts));
    } catch (e) {
      console.warn('Failed to save level attempts:', e);
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

      // Sync to API in background
      unlockAchievement(achievementId).catch((err) =>
        console.warn(`Failed to sync achievement ${achievementId} to API:`, err)
      );

      return true;
    }

    this.saveState();
    return false;
  }

  /**
   * Check and update achievements based on game stats
   * @param stats Stats from the current game session
   */
  checkAchievements(stats: SessionStats): string[] {
    this.trackLevelCompletion(stats);
    this.updateCumulativeStats(stats);

    const newlyEarned = this.checkAllAchievements(stats);
    this.saveState();
    return newlyEarned;
  }

  /**
   * Track level completion and world progress
   */
  private trackLevelCompletion(stats: SessionStats): void {
    if (stats.levelsCompleted === 0) return;

    const levelKey = `${stats.currentModeId}:${stats.currentLevelId}`;
    if (!this.state.completedLevelKeys) {
      this.state.completedLevelKeys = {};
    }

    if (this.state.completedLevelKeys[levelKey]) return; // Already tracked

    this.state.stats.totalLevelsCompleted += stats.levelsCompleted;
    this.state.completedLevelKeys[levelKey] = true;

    if (stats.currentWorldId !== null) {
      this.trackWorldProgress(stats.currentModeId, stats.currentWorldId);
    }

    this.updateNoResetStreak(stats.levelRestarted);
  }

  /**
   * Update no-reset streak counter
   */
  private updateNoResetStreak(levelRestarted?: boolean): void {
    if (!levelRestarted) {
      this.state.currentNoResetStreak = (this.state.currentNoResetStreak || 0) + 1;
    } else {
      this.state.currentNoResetStreak = 0;
    }

    this.state.stats.noResetStreak = Math.max(
      this.state.stats.noResetStreak,
      this.state.currentNoResetStreak
    );
  }

  /**
   * Update cumulative stats for performance metrics
   */
  private updateCumulativeStats(stats: SessionStats): void {
    this.state.stats.totalMovesUnderPar += stats.movesUnderPar;
    this.state.stats.totalSpeedruns += stats.speedruns;
    this.state.stats.totalWallsSurvived += stats.wallsSurvived;
    this.state.stats.totalNoHintsLevels += stats.noHintsLevels;

    if (stats.combo && stats.combo > this.state.stats.maxCombo) {
      this.state.stats.maxCombo = stats.combo;
    }

    this.updatePerfectTracking(stats);

    // Sync stats to server (fire and forget)
    updateUserStats({
      maxCombo: this.state.stats.maxCombo,
      wallsSurvived: this.state.stats.totalWallsSurvived,
      noResetStreak: this.state.stats.noResetStreak,
      speedLevels: this.state.stats.speedLevels,
      perfectLevels: this.state.stats.perfectLevels,
      daysPlayed: this.state.stats.totalDaysPlayed,
    }).catch(console.warn);
  }

  /**
   * Update perfect level and speed level tracking
   */
  private updatePerfectTracking(stats: SessionStats): void {
    if (stats.perfectLevel) {
      this.state.stats.perfectLevels += 1;
      this.perfectStreak += 1;
    } else if (stats.levelsCompleted > 0) {
      this.perfectStreak = 0;
    }

    if (stats.speedLevel) {
      this.state.stats.speedLevels += 1;
    }
  }

  /**
   * Check all achievements and return newly earned ones
   */
  private checkAllAchievements(stats: SessionStats): string[] {
    const newlyEarned: string[] = [];

    for (const achievement of this.achievements.values()) {
      if (!this.isAchievementEligible(achievement, stats)) continue;

      const current = this.getProgressValue(achievement.condition.type, stats);
      if (current === null) continue; // Skip custom checks here

      if (this.updateProgress(achievement.id, current)) {
        newlyEarned.push(achievement.id);
      }
    }

    return newlyEarned;
  }

  /**
   * Check if an achievement can be earned based on its conditions
   */
  private isAchievementEligible(achievement: Achievement, stats: SessionStats): boolean {
    const existing = this.state.progress[achievement.id];
    if (existing?.earned) return false;

    if (achievement.condition.modeId && achievement.condition.modeId !== stats.currentModeId) {
      return false;
    }
    if (achievement.condition.levelId && achievement.condition.levelId !== stats.currentLevelId) {
      return false;
    }

    return true;
  }

  /**
   * Get progress value for a condition type
   */
  private getProgressValue(type: string, stats: SessionStats): number | null {
    switch (type) {
      case 'levels_completed':
        return this.state.stats.totalLevelsCompleted;
      case 'moves_under_par':
        return this.state.stats.totalMovesUnderPar;
      case 'speedrun':
        return this.state.stats.totalSpeedruns;
      case 'streak':
        return stats.currentStreak;
      case 'no_hints':
        return this.state.stats.totalNoHintsLevels;
      case 'perfect_world':
        return stats.perfectWorlds;
      case 'survive_walls':
        return this.state.stats.totalWallsSurvived;
      case 'combo':
        return this.state.stats.maxCombo;
      case 'perfect_level':
        return this.state.stats.perfectLevels;
      case 'speed_level':
        return this.state.stats.speedLevels;
      case 'no_reset':
        return this.state.stats.noResetStreak;
      case 'total_days':
        return this.state.stats.totalDaysPlayed;
      case 'total_hours':
        return this.state.stats.totalHoursPlayed;
      case 'world_complete':
      case 'mode_complete':
      case 'custom':
        return null; // Handled separately
      default:
        return 0;
    }
  }

  /**
   * Track world progress for world completion achievements
   */
  private trackWorldProgress(modeId: string, worldId: number): void {
    if (!this.state.completedWorlds) {
      this.state.completedWorlds = {};
    }
    if (!this.state.completedWorlds[modeId]) {
      this.state.completedWorlds[modeId] = new Set();
    }

    // Check if all levels in this world are complete
    const mode = getModeById(modeId);
    const worldLevels = mode.getLevels().filter((l) => l.world === worldId);
    const allWorldLevelsComplete = worldLevels.every(
      (l) => this.state.completedLevelKeys?.[`${modeId}:${l.id}`]
    );

    if (allWorldLevelsComplete) {
      this.state.completedWorlds[modeId].add(worldId);

      // Check for world completion achievement
      const achievementId = `world_${worldId}_champion`;
      const altAchievementIds = [
        `world_${worldId}_explorer`,
        `world_${worldId}_master`,
        `world_${worldId}_legend`,
        `world_${worldId}_hero`,
      ];
      for (const id of [achievementId, ...altAchievementIds]) {
        if (this.achievements.has(id)) {
          this.updateProgress(id, 1);
        }
      }

      // Check for all worlds complete
      this.checkAllWorldsComplete(modeId);
    }

    // Check for mode completion
    this.checkModeComplete(modeId);
  }

  /**
   * Check if all worlds in a mode are complete
   */
  private checkAllWorldsComplete(modeId: string): void {
    const mode = getModeById(modeId);
    const allWorlds = new Set(mode.getLevels().map((l) => l.world));
    const completedWorlds = this.state.completedWorlds?.[modeId] || new Set();

    const allComplete = Array.from(allWorlds).every((w) => completedWorlds.has(w));
    if (allComplete && allWorlds.size > 0) {
      // Check all worlds across all modes
      this.checkAllWorldsCompleteAllModes();
    }
  }

  /**
   * Check if all worlds across all modes are complete
   */
  private checkAllWorldsCompleteAllModes(): void {
    // Get all unique worlds from all modes
    const allModes = [
      'classic',
      'zen',
      'blitz',
      'laserRelay',
      'memoryMatch',
      'gravityDrop',
      'mirrorForge',
      'voltage',
      'outbreak',
      'quantum_chain',
      'gemBlast',
      'shoppingSpree',
      'candy',
      'fuse',
    ];

    let totalWorlds = 0;
    let completedWorlds = 0;

    for (const modeId of allModes) {
      const mode = getModeById(modeId);
      const worlds = new Set(mode.getLevels().map((l) => l.world));
      totalWorlds += worlds.size;
      completedWorlds += this.state.completedWorlds?.[modeId]?.size || 0;
    }

    if (completedWorlds >= totalWorlds && totalWorlds > 0) {
      this.checkCustomAchievement('all_worlds_complete', { allWorldsComplete: true });
    }
  }

  /**
   * Check if a mode is fully complete
   */
  private checkModeComplete(modeId: string): void {
    if (this.state.completedModes?.has(modeId)) return;

    const mode = getModeById(modeId);
    const allLevels = mode.getLevels();
    const allComplete = allLevels.every(
      (l) => this.state.completedLevelKeys?.[`${modeId}:${l.id}`]
    );

    if (allComplete && allLevels.length > 0) {
      if (!this.state.completedModes) {
        this.state.completedModes = new Set();
      }
      this.state.completedModes.add(modeId);

      // Check for mode completion achievement
      const achievement = Array.from(this.achievements.values()).find(
        (a) => a.condition.type === 'mode_complete' && a.condition.modeId === modeId
      );
      if (achievement) {
        this.updateProgress(achievement.id, 1);
      }
    }
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

    // Custom check evaluators
    const CUSTOM_CHECK_EVALUATORS: Record<string, (data: Record<string, unknown>) => boolean> = {
      zen_complete: (d) => d.allZenLevelsComplete === true,
      blitz_complete: (d) => d.allBlitzLevelsComplete === true,
      all_worlds_complete: (d) => d.allWorldsComplete === true,
      first_try: (d) => d.attemptsBeforeWin !== undefined && (d.attemptsBeforeWin as number) >= 10,
      comeback_kid: (d) => d.comebackWin === true,
      perfect_streak: (d) => d.perfectStreak !== undefined && (d.perfectStreak as number) >= 5,
      night_owl: (d) => d.isNightOwl === true,
      early_bird: (d) => d.isEarlyBird === true,
    };

    const evaluator = CUSTOM_CHECK_EVALUATORS[checkId];
    const earned = evaluator ? evaluator(data) : false;

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
   * Track level attempt for "First Try" achievement
   */
  trackLevelAttempt(modeId: string, levelId: number): void {
    const key = `${modeId}:${levelId}`;
    this.levelAttempts[key] = (this.levelAttempts[key] || 0) + 1;
    this.saveLevelAttempts();
  }

  /**
   * Check "First Try" achievement when level is won
   */
  checkFirstTryAchievement(modeId: string, levelId: number): void {
    const key = `${modeId}:${levelId}`;
    const attempts = this.levelAttempts[key] || 0;
    if (attempts >= 10) {
      this.checkCustomAchievement('first_try', { attemptsBeforeWin: attempts });
    }
    // Reset attempts after win
    delete this.levelAttempts[key];
    this.saveLevelAttempts();
  }

  /**
   * Check time-based achievements (Night Owl, Early Bird)
   */
  checkTimeBasedAchievements(): void {
    const hour = new Date().getHours();

    // Night Owl: midnight to 4 AM
    if (hour >= 0 && hour < 4) {
      this.checkCustomAchievement('night_owl', { isNightOwl: true });
    }

    // Early Bird: before 6 AM (but not Night Owl time)
    if (hour >= 4 && hour < 6) {
      this.checkCustomAchievement('early_bird', { isEarlyBird: true });
    }
  }

  /**
   * Check perfect streak achievement
   */
  checkPerfectStreakAchievement(): void {
    if (this.perfectStreak >= 5) {
      this.checkCustomAchievement('perfect_streak', { perfectStreak: this.perfectStreak });
    }
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
      stats: { ...DEFAULT_STATS },
    };
    this.recentlyEarnedQueue = [];
    this.levelAttempts = {};
    this.perfectStreak = 0;
    this.saveState();
    this.saveLevelAttempts();
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
      const saved = localStorage.getItem(STORAGE_KEYS.DAILY_STREAK);
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
      }
      // else if (diffDays > 1): Streak broken - start over (already = 1)
      // diffDays === 0 means same day (shouldn't happen due to check above)
    }

    // Save updated streak
    const newData = { currentStreak: newStreak, lastPlayDate: today };
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_STREAK, JSON.stringify(newData));
    } catch (e) {
      console.warn('Failed to save streak data:', e);
    }

    // Update total days played
    this.state.stats.totalDaysPlayed += 1;
    this.saveState();

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

  /* ═══════════════════════════════════════════════════════════════════════════
     PLAY TIME TRACKING
  ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Start a play session (call when game starts)
   */
  startPlaySession(): void {
    this.sessionStartTime = Date.now();
    this.checkTimeBasedAchievements();
  }

  /**
   * End a play session (call when game ends or app closes)
   */
  endPlaySession(): void {
    const sessionDuration = (Date.now() - this.sessionStartTime) / 1000 / 3600; // hours
    this.state.stats.totalHoursPlayed += sessionDuration;
    this.saveState();

    // Check marathon achievement
    if (this.state.stats.totalHoursPlayed >= 100) {
      const achievement = this.achievements.get('marathon');
      if (achievement && !this.state.progress['marathon']?.earned) {
        this.updateProgress('marathon', this.state.stats.totalHoursPlayed);
      }
    }
  }

  /**
   * Get total play time in hours
   */
  getTotalPlayTime(): number {
    return this.state.stats.totalHoursPlayed;
  }
}

export { AchievementEngine };
