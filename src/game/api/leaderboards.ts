/**
 * Leaderboard and Achievement API Client
 * Handles syncing scores, achievements, and fetching leaderboards
 */

import { robustFetch } from '@/game/engine/backends';
import { getUserId } from '@/game/contexts/GameEngineProvider';

const VITE_API_URL = import.meta.env.VITE_API_URL || '';

/** Leaderboard entry with user and score info */
interface LeaderboardEntry {
  userId: string;
  user_id?: string;
  username?: string;
  score: number;
  levelId?: number;
  createdAt?: string;
  [key: string]: unknown;
}

/** User profile information */
interface UserProfile {
  userId: string;
  username?: string;
  totalScore?: number;
  levelsCompleted?: number;
  achievementsCount?: number;
  profile?: {
    username?: string;
    totalScore?: number;
    levelsCompleted?: number;
  };
  achievements?: Array<{
    id: string;
    name?: string;
    icon?: string;
    unlockedAt?: string;
    [key: string]: unknown;
  }>;
  wins?: Array<{
    user_id: string;
    mode: string;
    level_id: number;
    score: number;
    created_at: string;
    username?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/** Achievement entry */
interface AchievementEntry {
  id: string;
  userId: string;
  unlockedAt?: string;
  [key: string]: unknown;
}

/** Replay move data */
interface ReplayMove {
  [key: string]: unknown;
}

/** Replay data */
interface ReplayData {
  moves: ReplayMove[];
  score: number;
  [key: string]: unknown;
}

/**
 * API endpoint paths - centralized to prevent duplication
 */
const API_PATHS = {
  HIGHSCORE: (userId: string, mode: string, levelId: number) =>
    `/api/highscore/${userId}/${mode}/${levelId}`,
  ACHIEVEMENT: (userId: string) => `/api/achievement/${userId}`,
  ACHIEVEMENTS: () => `/api/achievements`,
  LEADERBOARD: (mode: string) => `/api/leaderboard/${mode}`,
  PROFILE: (userId: string) => `/api/profile/${userId}`,
  PROFILE_WINS: (userId: string) => `/api/profile/${userId}/wins`,
  PROFILE_FULL: (userId: string) => `/api/profile/${userId}/full`,
  REPLAY_SAVE: (userId: string, mode: string, levelId: number) =>
    `/api/replay/${userId}/${mode}/${levelId}`,
  REPLAY_GET: (userId: string, mode: string, levelId: number) =>
    `/api/replay/${userId}/${mode}/${levelId}`,
} as const;

/**
 * Construct API base URL by removing /api.php suffix (no trailing slash)
 */
function getApiBaseUrl(): string {
  if (!VITE_API_URL) return '';
  return VITE_API_URL.replace('/api.php', '').replace(/\/$/, '');
}

const API_URL = getApiBaseUrl();

/**
 * Generic fetch helper for API calls
 */
async function fetchFromApi<T = Record<string, unknown>>(
  url: string,
  allow404 = false
): Promise<T | null> {
  try {
    const response = await robustFetch(url);

    if (!response.ok) {
      if (response.status === 404 && allow404) {
        return null;
      }
      console.error(`[API] Request failed: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[API] Error fetching ${url}:`, error);
    return null;
  }
}

/**
 * Wrapper for POST/PUT requests with error handling
 */
async function fetchWithBody(
  url: string,
  method: 'POST' | 'PUT',
  body: Record<string, unknown>
): Promise<boolean> {
  try {
    const response = await robustFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`[API] Request failed: ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[API] Error in ${method} request:`, error);
    return false;
  }
}

/**
 * Save a highscore to the API
 * Score is calculated server-side based on mode and level difficulty
 */
export async function saveHighscore(
  mode: string,
  levelId: number,
  moves: number,
  time: number
): Promise<boolean> {
  if (!API_URL) {
    console.warn('[Leaderboard] API URL not configured');
    return false;
  }

  const userId = getUserId();
  const url = `${API_URL}${API_PATHS.HIGHSCORE(userId, mode, levelId)}`;
  const success = await fetchWithBody(url, 'POST', { moves, time });
  if (success) {
    console.log(`[Leaderboard] Saved highscore for ${mode} level ${levelId}`);
  }
  return success;
}

/**
 * Unlock an achievement
 */
export async function unlockAchievement(achievementId: string): Promise<boolean> {
  if (!API_URL) {
    console.warn('[Achievement] API URL not configured');
    return false;
  }

  try {
    const userId = getUserId();
    const url = `${API_URL}/api/achievement/${userId}/${achievementId}`;
    const response = await robustFetch(url, { method: 'POST' });

    if (!response.ok) {
      console.error('[Achievement] Failed to unlock achievement:', response.status);
      return false;
    }

    console.log(`[Achievement] Unlocked: ${achievementId}`);
    return true;
  } catch (error) {
    console.error('[Achievement] Error unlocking achievement:', error);
    return false;
  }
}

/**
 * Get leaderboard for a mode
 */
export async function getLeaderboard(
  mode: string,
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  if (!API_URL) {
    console.warn('[Leaderboard] API URL not configured');
    return [];
  }

  try {
    const response = await robustFetch(`${API_URL}${API_PATHS.LEADERBOARD(mode)}?limit=${limit}`);

    if (!response.ok) {
      console.error('[Leaderboard] Failed to fetch leaderboard:', response.status);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[Leaderboard] Error fetching leaderboard:', error);
    return [];
  }
}

/**
 * Get user's achievements
 */
export async function getUserAchievements(userId?: string): Promise<AchievementEntry[]> {
  if (!API_URL) {
    console.warn('[Achievement] API URL not configured');
    return [];
  }

  const id = userId || getUserId();
  const result = await fetchFromApi<any[]>(`${API_URL}${API_PATHS.ACHIEVEMENT(id)}`, true);
  return (Array.isArray(result) ? result : null) || [];
}

/**
 * Get achievement statistics (who unlocked what)
 */
export async function getAchievementStats(limit: number = 100): Promise<AchievementEntry[]> {
  if (!API_URL) {
    console.warn('[Achievement] API URL not configured');
    return [];
  }

  try {
    const response = await robustFetch(`${API_URL}/api/achievements?limit=${limit}`);

    if (!response.ok) {
      console.error('[Achievement] Failed to fetch achievement stats:', response.status);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[Achievement] Error fetching achievement stats:', error);
    return [];
  }
}

/**
 * Update user stats (performance metrics)
 */
export async function updateUserStats(stats: {
  maxCombo?: number;
  wallsSurvived?: number;
  noResetStreak?: number;
  speedLevels?: number;
  perfectLevels?: number;
  daysPlayed?: number;
}): Promise<boolean> {
  if (!API_URL) {
    console.warn('[Profile] API URL not configured');
    return false;
  }

  const userId = getUserId();
  const url = `${API_URL}/api/profile/${userId}/stats`;
  const success = await fetchWithBody(url, 'POST', stats);
  if (success) {
    console.log('[Profile] Updated user stats');
  }
  return success;
}

/**
 * Get user profile
 */
export async function getUserProfile(userId?: string): Promise<UserProfile | null> {
  if (!API_URL) {
    console.warn('[Profile] API URL not configured');
    return null;
  }

  const id = userId || getUserId();
  return await fetchFromApi(`${API_URL}${API_PATHS.PROFILE(id)}`, false);
}

/**
 * Update user profile (username)
 */
export async function updateUserProfile(username: string, userId?: string): Promise<boolean> {
  if (!API_URL) {
    console.warn('[Profile] API URL not configured');
    return false;
  }

  const id = userId || getUserId();
  const url = `${API_URL}${API_PATHS.PROFILE(id)}`;
  const success = await fetchWithBody(url, 'POST', { username });
  if (success) {
    console.log(`[Profile] Updated username to: ${username}`);
  }
  return success;
}

/**
 * Get user wins (game history)
 */
export async function getUserWins(
  userId?: string,
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  if (!API_URL) {
    console.warn('[Profile] API URL not configured');
    return [];
  }

  const id = userId || getUserId();
  const result = await fetchFromApi<any[]>(
    `${API_URL}${API_PATHS.PROFILE_WINS(id)}?limit=${limit}`,
    true
  );
  return (Array.isArray(result) ? result : null) || [];
}

/**
 * Save replay data for a completed game
 */
export async function saveReplay(
  mode: string,
  levelId: number,
  moves: ReplayMove[],
  score: number
): Promise<boolean> {
  if (!API_URL) {
    console.warn('[Replay] API URL not configured');
    return false;
  }

  const userId = getUserId();
  const url = `${API_URL}${API_PATHS.REPLAY_SAVE(userId, mode, levelId)}`;
  const success = await fetchWithBody(url, 'POST', { moves, score });
  if (success) {
    console.log(`[Replay] Saved replay for ${mode} level ${levelId}`);
  }
  return success;
}

/**
 * Get replay data for a specific game
 */
export async function getReplay(
  userId: string,
  mode: string,
  levelId: number
): Promise<ReplayData | null> {
  if (!API_URL) {
    console.warn('[Replay] API URL not configured');
    return null;
  }

  try {
    const response = await robustFetch(`${API_URL}${API_PATHS.REPLAY_GET(userId, mode, levelId)}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error('[Replay] Failed to fetch replay:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[Replay] Error fetching replay:', error);
    return null;
  }
}

/**
 * Get complete user profile (profile + achievements + wins + rankings) in one call
 */
export async function getCompleteUserProfile(
  userId?: string
): Promise<(UserProfile & { rankings: Record<string, number> }) | null> {
  if (!API_URL) {
    console.warn('[Profile] API URL not configured');
    return null;
  }

  const id = userId || getUserId();

  try {
    // Fetch profile data and rankings in parallel
    const [profileData, leaderboards] = await Promise.all([
      fetchFromApi(`${API_URL}${API_PATHS.PROFILE_FULL(id)}`, false),
      Promise.all([
        getLeaderboard('classic', 100),
        getLeaderboard('blitz', 100),
        getLeaderboard('zen', 100),
        getLeaderboard('candy', 100),
        getLeaderboard('shoppingSpree', 100),
        getLeaderboard('gemBlast', 100),
      ]),
    ]);

    if (!profileData) return null;

    // Calculate rankings
    const modes = ['classic', 'blitz', 'zen', 'candy', 'shoppingSpree', 'gemBlast'];
    const rankings: Record<string, number> = {};

    modes.forEach((mode, idx) => {
      const leaderboard = leaderboards[idx];
      const rank = leaderboard.findIndex((entry) => (entry.user_id || entry.userId) === id);
      if (rank >= 0) rankings[mode] = rank + 1;
    });

    return {
      ...profileData,
      userId: id,
      rankings,
    } as UserProfile & { rankings: Record<string, number> };
  } catch (error) {
    console.error('[Profile] Error fetching complete profile:', error);
    return null;
  }
}
