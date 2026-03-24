import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveHighscore,
  unlockAchievement,
  getLeaderboard,
  getUserAchievements,
  getAchievementStats,
  updateUserStats,
  getUserProfile,
  updateUserProfile,
  getUserWins,
  saveReplay,
  getReplay,
  getCompleteUserProfile,
} from './leaderboards';
import * as backends from '@/game/engine/backends';
import * as userId from '@/game/utils/userId';

vi.mock('@/game/engine/backends');
vi.mock('@/game/utils/userId');

describe('Leaderboards API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userId.getUserId).mockReturnValue('test-user-123');
  });

  describe('saveHighscore', () => {
    it('should save highscore with moves and time', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({}) };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await saveHighscore('classic', 1, 5, 120);

      expect(result).toBe(true);
      expect(backends.robustFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/highscore/test-user-123/classic/1'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle API failure', async () => {
      const mockResponse = { ok: false, status: 500 };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await saveHighscore('classic', 1, 5, 120);

      expect(result).toBe(false);
    });

    it('should handle network error', async () => {
      vi.mocked(backends.robustFetch).mockRejectedValue(new Error('Network error'));

      const result = await saveHighscore('classic', 1, 5, 120);

      expect(result).toBe(false);
    });
  });

  describe('unlockAchievement', () => {
    it('should unlock achievement successfully', async () => {
      const mockResponse = { ok: true };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await unlockAchievement('first_win');

      expect(result).toBe(true);
      expect(backends.robustFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/achievement/test-user-123/first_win'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle unlock failure', async () => {
      const mockResponse = { ok: false, status: 400 };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await unlockAchievement('invalid');

      expect(result).toBe(false);
    });

    it('should handle network error in unlock', async () => {
      vi.mocked(backends.robustFetch).mockRejectedValue(new Error('Network error'));

      const result = await unlockAchievement('first_win');

      expect(result).toBe(false);
    });
  });

  describe('getLeaderboard', () => {
    it('should fetch leaderboard for a mode', async () => {
      const mockData = [
        { userId: 'user1', score: 1000 },
        { userId: 'user2', score: 900 },
      ];
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue(mockData) };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await getLeaderboard('classic', 50);

      expect(result).toEqual(mockData);
      expect(backends.robustFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/leaderboard/classic?limit=50')
      );
    });

    it('should use default limit of 100', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue([]) };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      await getLeaderboard('blitz');

      expect(backends.robustFetch).toHaveBeenCalledWith(expect.stringContaining('limit=100'));
    });

    it('should return empty array on failure', async () => {
      const mockResponse = { ok: false, status: 404 };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await getLeaderboard('classic');

      expect(result).toEqual([]);
    });

    it('should handle non-array response', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({ error: 'invalid' }) };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await getLeaderboard('classic');

      expect(result).toEqual([]);
    });

    it('should handle network error', async () => {
      vi.mocked(backends.robustFetch).mockRejectedValue(new Error('Network error'));

      const result = await getLeaderboard('classic');

      expect(result).toEqual([]);
    });
  });

  describe('getUserAchievements', () => {
    it('should fetch user achievements', async () => {
      const mockData = [{ id: 'first_win', userId: 'test-user-123', unlockedAt: '2025-01-01' }];
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue(mockData) };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await getUserAchievements();

      expect(result).toEqual(mockData);
    });

    it('should fetch achievements for specific user', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue([]) };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      await getUserAchievements('other-user');

      expect(backends.robustFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/achievement/other-user')
      );
    });

    it('should return empty array on 404', async () => {
      const mockResponse = { ok: false, status: 404 };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await getUserAchievements();

      expect(result).toEqual([]);
    });

    it('should handle non-array response', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue(null) };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await getUserAchievements();

      expect(result).toEqual([]);
    });
  });

  describe('getAchievementStats', () => {
    it('should fetch achievement statistics', async () => {
      const mockData = [
        { id: 'first_win', userId: 'user1' },
        { id: 'first_win', userId: 'user2' },
      ];
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue(mockData) };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await getAchievementStats(200);

      expect(result).toEqual(mockData);
      expect(backends.robustFetch).toHaveBeenCalledWith(expect.stringContaining('limit=200'));
    });

    it('should use default limit of 100', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue([]) };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      await getAchievementStats();

      expect(backends.robustFetch).toHaveBeenCalledWith(expect.stringContaining('limit=100'));
    });

    it('should return empty array on failure', async () => {
      const mockResponse = { ok: false, status: 500 };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await getAchievementStats();

      expect(result).toEqual([]);
    });

    it('should handle network error', async () => {
      vi.mocked(backends.robustFetch).mockRejectedValue(new Error('Network error'));

      const result = await getAchievementStats();

      expect(result).toEqual([]);
    });
  });

  describe('updateUserStats', () => {
    it('should update user stats', async () => {
      const mockResponse = { ok: true };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const stats = {
        maxCombo: 50,
        wallsSurvived: 100,
        noResetStreak: 5,
      };

      const result = await updateUserStats(stats);

      expect(result).toBe(true);
      expect(backends.robustFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile/test-user-123/stats'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle stats update failure', async () => {
      const mockResponse = { ok: false, status: 400 };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await updateUserStats({ maxCombo: 50 });

      expect(result).toBe(false);
    });

    it('should handle empty stats', async () => {
      const mockResponse = { ok: true };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await updateUserStats({});

      expect(result).toBe(true);
    });
  });

  describe('getUserProfile', () => {
    it('should fetch user profile', async () => {
      const mockProfile = { userId: 'test-user-123', username: 'TestUser' };
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue(mockProfile) };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await getUserProfile();

      expect(result).toEqual(mockProfile);
    });

    it('should fetch profile for specific user', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({}) };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      await getUserProfile('other-user');

      expect(backends.robustFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile/other-user')
      );
    });

    it('should return null on fetch error', async () => {
      const mockResponse = { ok: false };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await getUserProfile();

      expect(result).toBeNull();
    });

    it('should handle network error', async () => {
      vi.mocked(backends.robustFetch).mockRejectedValue(new Error('Network error'));

      const result = await getUserProfile();

      expect(result).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('should update username', async () => {
      const mockResponse = { ok: true };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await updateUserProfile('NewUsername');

      expect(result).toBe(true);
      expect(backends.robustFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile/test-user-123'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should update profile for specific user', async () => {
      const mockResponse = { ok: true };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      await updateUserProfile('NewName', 'other-user');

      expect(backends.robustFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile/other-user'),
        expect.any(Object)
      );
    });

    it('should handle update failure', async () => {
      const mockResponse = { ok: false };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await updateUserProfile('NewUsername');

      expect(result).toBe(false);
    });
  });

  describe('getUserWins', () => {
    it('should fetch user wins', async () => {
      const mockWins = [{ user_id: 'test-user-123', mode: 'classic', level_id: 1, score: 1000 }];
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue(mockWins) };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await getUserWins();

      expect(result).toEqual(mockWins);
      expect(backends.robustFetch).toHaveBeenCalledWith(expect.stringContaining('limit=50'));
    });

    it('should use custom limit', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue([]) };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      await getUserWins(undefined, 100);

      expect(backends.robustFetch).toHaveBeenCalledWith(expect.stringContaining('limit=100'));
    });

    it('should fetch wins for specific user', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue([]) };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      await getUserWins('other-user');

      expect(backends.robustFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile/other-user/wins')
      );
    });

    it('should return empty array on 404', async () => {
      const mockResponse = { ok: false, status: 404 };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await getUserWins();

      expect(result).toEqual([]);
    });
  });

  describe('saveReplay', () => {
    it('should save replay data', async () => {
      const mockResponse = { ok: true };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const moves = [{ tileId: 't1', rotation: 1 }];
      const result = await saveReplay('classic', 1, moves, 1000);

      expect(result).toBe(true);
      expect(backends.robustFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/replay/test-user-123/classic/1'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle replay save failure', async () => {
      const mockResponse = { ok: false };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await saveReplay('blitz', 2, [], 500);

      expect(result).toBe(false);
    });

    it('should handle empty moves array', async () => {
      const mockResponse = { ok: true };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await saveReplay('zen', 3, [], 0);

      expect(result).toBe(true);
    });
  });

  describe('getReplay', () => {
    it('should fetch replay data', async () => {
      const mockReplay = {
        moves: [{ tileId: 't1', rotation: 1 }],
        score: 1000,
      };
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue(mockReplay) };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await getReplay('test-user', 'classic', 1);

      expect(result).toEqual(mockReplay);
    });

    it('should return null for 404', async () => {
      const mockResponse = { ok: false, status: 404 };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await getReplay('test-user', 'classic', 99);

      expect(result).toBeNull();
    });

    it('should handle other errors', async () => {
      const mockResponse = { ok: false, status: 500 };
      vi.mocked(backends.robustFetch).mockResolvedValue(mockResponse as any);

      const result = await getReplay('test-user', 'classic', 1);

      expect(result).toBeNull();
    });

    it('should handle network error', async () => {
      vi.mocked(backends.robustFetch).mockRejectedValue(new Error('Network error'));

      const result = await getReplay('test-user', 'blitz', 2);

      expect(result).toBeNull();
    });
  });

  describe('getCompleteUserProfile', () => {
    it('should fetch complete user profile with rankings', async () => {
      const mockProfile = { userId: 'test-user-123', username: 'TestUser' };
      const mockLeaderboard = [
        { userId: 'test-user-123', score: 1000 },
        { userId: 'user2', score: 900 },
      ];

      vi.mocked(backends.robustFetch).mockImplementation((url: string) => {
        if (url.includes('/full')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockProfile),
          } as any);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockLeaderboard),
        } as any);
      });

      const result = await getCompleteUserProfile();

      expect(result).toBeDefined();
      expect(result?.userId).toBe('test-user-123');
      expect(result?.rankings).toBeDefined();
    });

    it('should return null if profile fetch fails', async () => {
      vi.mocked(backends.robustFetch).mockResolvedValue({
        ok: false,
        status: 404,
      } as any);

      const result = await getCompleteUserProfile();

      expect(result).toBeNull();
    });

    it('should calculate rankings correctly', async () => {
      const mockProfile = { userId: 'other-user', username: 'OtherUser' };
      const mockLeaderboard = [
        { user_id: 'user1', score: 1000 },
        { user_id: 'other-user', score: 900 },
        { user_id: 'user3', score: 800 },
      ];

      vi.mocked(backends.robustFetch).mockImplementation((url: string) => {
        if (url.includes('/full')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockProfile),
          } as any);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockLeaderboard),
        } as any);
      });

      const result = await getCompleteUserProfile('other-user');

      expect(result?.rankings?.classic).toBe(2);
    });

    it('should handle network error', async () => {
      vi.mocked(backends.robustFetch).mockRejectedValue(new Error('Network error'));

      const result = await getCompleteUserProfile();

      expect(result).toBeNull();
    });
  });
});
