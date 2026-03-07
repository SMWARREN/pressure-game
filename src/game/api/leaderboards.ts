/**
 * Leaderboard and Achievement API Client
 * Handles syncing scores, achievements, and fetching leaderboards
 */

import { robustFetch } from '@/game/engine/backends';

const VITE_API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Construct API URL by removing /api.php suffix and ensuring single trailing slash
 */
function getApiBaseUrl(): string {
  if (!VITE_API_URL) return '';
  const baseUrl = VITE_API_URL.replace('/api.php', '');
  return baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
}

const API_URL = getApiBaseUrl();

/**
 * Get the user ID from localStorage
 */
function getUserId(): string {
  const stored = localStorage.getItem('pressure_user_id');
  return stored || 'anonymous';
}

/**
 * Save a highscore to the API
 */
export async function saveHighscore(
  mode: string,
  levelId: number,
  score: number
): Promise<boolean> {
  if (!API_URL) {
    console.warn('[Leaderboard] API URL not configured');
    return false;
  }

  try {
    const userId = getUserId();
    const response = await robustFetch(`${API_URL}/api/highscore/${userId}/${mode}/${levelId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score }),
    });

    if (!response.ok) {
      console.error('[Leaderboard] Failed to save highscore:', response.status);
      return false;
    }

    console.log(`[Leaderboard] Saved score ${score} for ${mode} level ${levelId}`);
    return true;
  } catch (error) {
    console.error('[Leaderboard] Error saving highscore:', error);
    return false;
  }
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
    const response = await robustFetch(`${API_URL}/api/achievement/${userId}/${achievementId}`, {
      method: 'POST',
    });

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
export async function getLeaderboard(mode: string, limit: number = 100): Promise<any[]> {
  if (!API_URL) {
    console.warn('[Leaderboard] API URL not configured');
    return [];
  }

  try {
    const response = await robustFetch(`${API_URL}/api/leaderboard/${mode}?limit=${limit}`);

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
export async function getUserAchievements(userId?: string): Promise<any[]> {
  if (!API_URL) {
    console.warn('[Achievement] API URL not configured');
    return [];
  }

  try {
    const id = userId || getUserId();
    const response = await robustFetch(`${API_URL}/api/achievement/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        return []; // No achievements yet
      }
      console.error('[Achievement] Failed to fetch achievements:', response.status);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[Achievement] Error fetching achievements:', error);
    return [];
  }
}

/**
 * Get achievement statistics (who unlocked what)
 */
export async function getAchievementStats(limit: number = 100): Promise<any[]> {
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
 * Get user profile
 */
export async function getUserProfile(userId?: string): Promise<any> {
  if (!API_URL) {
    console.warn('[Profile] API URL not configured');
    return null;
  }

  try {
    const id = userId || getUserId();
    const response = await robustFetch(`${API_URL}/api/profile/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // User doesn't exist yet
      }
      console.error('[Profile] Failed to fetch profile:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[Profile] Error fetching profile:', error);
    return null;
  }
}

/**
 * Update user profile (username)
 */
export async function updateUserProfile(username: string, userId?: string): Promise<boolean> {
  if (!API_URL) {
    console.warn('[Profile] API URL not configured');
    return false;
  }

  try {
    const id = userId || getUserId();
    const response = await robustFetch(`${API_URL}/api/profile/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      console.error('[Profile] Failed to update profile:', response.status);
      return false;
    }

    console.log(`[Profile] Updated username to: ${username}`);
    return true;
  } catch (error) {
    console.error('[Profile] Error updating profile:', error);
    return false;
  }
}
