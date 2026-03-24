<?php

require_once __DIR__ . '/TestCase.php';

use Pressure\StatsController;

class StatsControllerRefactoredTest extends TestCase
{
    public function testUpdateStatsSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO user_stats (user_id) VALUES ('user1')");

        $payload = json_encode([
            'user_id' => 'user1',
            'total_levels_completed' => 5,
            'total_score' => 5000,
            'max_combo' => 10
        ]);
        InputStreamWrapper::register($payload);

        $response = $this->callController(
            fn() => (new StatsController($this->db))->update()
        );
        InputStreamWrapper::unregister();

        $this->assertTrue($response['success']);
    }

    public function testUpdateStatsMissingUserId(): void
    {
        $payload = json_encode(['total_score' => 5000]);
        InputStreamWrapper::register($payload);

        $response = $this->callController(
            fn() => (new StatsController($this->db))->update()
        );
        InputStreamWrapper::unregister();

        $this->assertArrayHasKey('error', $response);
    }

    public function testUpdateStatsNoUpdates(): void
    {
        $this->db->conn->query("INSERT INTO users (id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO user_stats (user_id) VALUES ('user1')");

        $payload = json_encode(['user_id' => 'user1']);
        InputStreamWrapper::register($payload);

        $response = $this->callController(
            fn() => (new StatsController($this->db))->update()
        );
        InputStreamWrapper::unregister();

        $this->assertTrue($response['success']);
        $this->assertStringContainsString('No updates', $response['message']);
    }

    public function testUpdateStatsAllFields(): void
    {
        $this->db->conn->query("INSERT INTO users (id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO user_stats (user_id) VALUES ('user1')");

        $payload = json_encode([
            'user_id' => 'user1',
            'total_levels_completed' => 10,
            'total_score' => 10000,
            'max_combo' => 20,
            'total_walls_survived' => 5,
            'no_reset_streak' => 3,
            'speed_levels' => 2,
            'perfect_levels' => 1,
            'total_hours_played' => 5.5
        ]);
        InputStreamWrapper::register($payload);

        $response = $this->callController(
            fn() => (new StatsController($this->db))->update()
        );
        InputStreamWrapper::unregister();

        $this->assertTrue($response['success']);

        // Verify data was saved
        $userId = 'user1';
        $stmt = $this->db->conn->prepare('SELECT * FROM user_stats WHERE user_id = ?');
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $stats = $result->fetch_assoc();

        $this->assertSame(10, (int) $stats['total_levels_completed']);
        $this->assertSame(20, (int) $stats['max_combo']);
        $this->assertSame(5.5, (float) $stats['total_hours_played']);
    }

    public function testGetStatsSuccess(): void
    {
        $this->db->conn->query("INSERT INTO users (id) VALUES ('user1')");
        $this->db->conn->query("INSERT INTO user_stats (user_id, total_score) VALUES ('user1', 5000)");

        $_GET = ['user_id' => 'user1'];
        $response = $this->callController(
            fn() => (new StatsController($this->db))->get()
        );

        $this->assertArrayHasKey('user_id', $response);
        $this->assertSame(5000, (int) $response['total_score']);
    }

    public function testGetStatsMissingUserId(): void
    {
        $_GET = [];
        $response = $this->callController(
            fn() => (new StatsController($this->db))->get()
        );

        $this->assertArrayHasKey('error', $response);
    }

    public function testGetStatsNonexistent(): void
    {
        $_GET = ['user_id' => 'nonexistent'];
        $response = $this->callController(
            fn() => (new StatsController($this->db))->get()
        );

        $this->assertEmpty($response);
    }
}
