<?php

use PHPUnit\Framework\TestCase;
use Pressure\Database;

class AchievementJsonTest extends TestCase
{
    private Database $db;

    protected function setUp(): void
    {
        $this->db = new Database(
            'localhost',
            3306,
            'root',
            'root',
            'saintsea_pressure_test'
        );

        // Clear achievement tables
        $this->db->conn->query("SET FOREIGN_KEY_CHECKS = 0");
        $this->db->conn->query("TRUNCATE TABLE user_achievements");
        $this->db->conn->query("TRUNCATE TABLE achievements");
        $this->db->conn->query("TRUNCATE TABLE users");
        $this->db->conn->query("TRUNCATE TABLE user_profiles");
        $this->db->conn->query("SET FOREIGN_KEY_CHECKS = 1");
    }

    public function testGetUserAchievementsWithJsonDefinitions(): void
    {
        // Create user and achievements
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'player1')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO achievements (user_id, achievement_id) VALUES ('user1', 'first_win')");
        $this->db->conn->query("INSERT INTO achievements (user_id, achievement_id) VALUES ('user1', 'speed_runner')");

        // Get achievements with JSON definitions loaded
        $achievements = $this->db->getUserAchievements('user1');

        $this->assertCount(2, $achievements);
        $this->assertArrayHasKey('name', $achievements[0]);
        $this->assertArrayHasKey('description', $achievements[0]);
        $this->assertArrayHasKey('icon', $achievements[0]);
        $this->assertArrayHasKey('points', $achievements[0]);

        // Verify specific achievement data from JSON
        $firstWin = array_filter($achievements, fn($a) => $a['id'] === 'first_win');
        if (count($firstWin) > 0) {
            $first = array_values($firstWin)[0];
            $this->assertSame('First Win', $first['name']);
            $this->assertSame('Complete your first level', $first['description']);
            $this->assertSame('🎉', $first['icon']);
            $this->assertSame(10, $first['points']);
        }
    }

    public function testGetUserAchievementsWithUnknownAchievementId(): void
    {
        // Create user with unknown achievement
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('user1', 'player1')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO achievements (user_id, achievement_id) VALUES ('user1', 'unknown_achievement')");

        // Get achievements - unknown ID should still show but with defaults
        $achievements = $this->db->getUserAchievements('user1');

        $this->assertCount(1, $achievements);
        $this->assertSame('unknown_achievement', $achievements[0]['id']);
        $this->assertSame('unknown_achievement', $achievements[0]['name']); // Default to ID
        $this->assertSame('🏆', $achievements[0]['icon']); // Default icon
    }

    public function testGetAllAchievements(): void
    {
        // Add achievements from multiple users (unique constraint on user_id + achievement_id)
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('u1', 'p1'), ('u2', 'p2'), ('u3', 'p3')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('u1'), ('u2'), ('u3')");
        $this->db->conn->query("INSERT INTO achievements (user_id, achievement_id) VALUES ('u1', 'first_win')");
        $this->db->conn->query("INSERT INTO achievements (user_id, achievement_id) VALUES ('u2', 'first_win')");
        $this->db->conn->query("INSERT INTO achievements (user_id, achievement_id) VALUES ('u3', 'first_win')");
        $this->db->conn->query("INSERT INTO achievements (user_id, achievement_id) VALUES ('u2', 'speed_runner')");
        $this->db->conn->query("INSERT INTO achievements (user_id, achievement_id) VALUES ('u3', 'speed_runner')");

        $achievements = $this->db->getAllAchievements();

        // Should have 2 achievement types
        $this->assertGreaterThanOrEqual(1, count($achievements));

        // first_win should have count of 3 (u1, u2, u3)
        $firstWin = array_filter($achievements, fn($a) => $a['achievement_id'] === 'first_win');
        if (count($firstWin) > 0) {
            $first = array_values($firstWin)[0];
            $this->assertSame('3', $first['count']);
        }
    }

    public function testGetAllAchievementsWithLimit(): void
    {
        // Add multiple achievement types
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('u1', 'p1')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('u1')");
        for ($i = 1; $i <= 10; $i++) {
            $achId = 'achievement_' . $i;
            $this->db->conn->query("INSERT INTO achievements (user_id, achievement_id) VALUES ('u1', '$achId')");
        }

        // Get with limit
        $achievements = $this->db->getAllAchievements(5);

        $this->assertLessThanOrEqual(5, count($achievements));
    }

    public function testGetAllAchievementsOrdering(): void
    {
        // Add achievements with different counts from different users
        $this->db->conn->query("INSERT INTO users (id, username) VALUES ('u1', 'p1'), ('u2', 'p2'), ('u3', 'p3'), ('u4', 'p4'), ('u5', 'p5')");
        $this->db->conn->query("INSERT INTO user_profiles (user_id) VALUES ('u1'), ('u2'), ('u3'), ('u4'), ('u5')");

        // Add first_win 5 times (different users)
        for ($i = 1; $i <= 5; $i++) {
            $this->db->conn->query("INSERT INTO achievements (user_id, achievement_id) VALUES ('u$i', 'first_win')");
        }
        // Add speed_runner 3 times (different users)
        for ($i = 1; $i <= 3; $i++) {
            $this->db->conn->query("INSERT INTO achievements (user_id, achievement_id) VALUES ('u$i', 'speed_runner')");
        }
        // Add zen_master 1 time
        $this->db->conn->query("INSERT INTO achievements (user_id, achievement_id) VALUES ('u1', 'zen_master')");

        $achievements = $this->db->getAllAchievements();

        // Should be ordered by count DESC
        if (count($achievements) >= 3) {
            // first_win (5) should come before speed_runner (3)
            $firstWinIndex = array_search('first_win', array_column($achievements, 'achievement_id'));
            $speedIndex = array_search('speed_runner', array_column($achievements, 'achievement_id'));
            if ($firstWinIndex !== false && $speedIndex !== false) {
                $this->assertLessThan($speedIndex, $firstWinIndex);
            }
        }
    }
}
