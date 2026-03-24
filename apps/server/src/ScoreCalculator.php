<?php

namespace Pressure;

class ScoreCalculator
{
    /**
     * Calculate final score based on mode, moves, elapsed time, and level ID.
     *
     * Arcade modes (non-classic/blitz/zen) that don't provide a score will
     * receive 0 rather than having a server-side score fabricated.
     */
    public static function calculate(string $mode, int $moves, float $time, int $levelId): int
    {
        $levels      = Config::getLevels();
        $multipliers = Config::getScoreMultipliers();

        $difficulty = $levels[$levelId] ?? 'medium';
        $multiplier = $multipliers[$mode][$difficulty] ?? 1.0;

        $baseScore = match ($mode) {
            'classic' => 10000 - ($moves + (int) $time),
            'blitz'   => 10000 - (int) $time,
            'zen'     => 10000 - $moves,
            default   => 1000,
        };

        return max(0, (int) ($baseScore * $multiplier));
    }
}
