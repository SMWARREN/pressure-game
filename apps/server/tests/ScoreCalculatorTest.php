<?php

use PHPUnit\Framework\TestCase;
use Pressure\ScoreCalculator;

/**
 * Pure unit tests for ScoreCalculator — no database required.
 */
class ScoreCalculatorTest extends TestCase
{
    // ─── Classic mode ────────────────────────────────────────────────────────

    public function testClassicEasyLevel(): void
    {
        // base = 10000 - (moves + time), multiplier 1.0 for easy
        $score = ScoreCalculator::calculate('classic', 5, 10.0, 1);
        $this->assertSame(9985, $score);
    }

    public function testClassicMediumLevel(): void
    {
        // base = 10000 - (10 + 20) = 9970, multiplier 1.5
        $score = ScoreCalculator::calculate('classic', 10, 20.0, 4);
        $this->assertSame((int)(9970 * 1.5), $score);
    }

    public function testClassicHardLevel(): void
    {
        // base = 10000 - (15 + 30) = 9955, multiplier 2.0
        $score = ScoreCalculator::calculate('classic', 15, 30.0, 8);
        $this->assertSame(9955 * 2, $score);
    }

    // ─── Blitz mode ──────────────────────────────────────────────────────────

    public function testBlitzEasyLevel(): void
    {
        // base = 10000 - time; moves are irrelevant
        $score = ScoreCalculator::calculate('blitz', 99, 50.0, 2);
        $this->assertSame((int)((10000 - 50) * 2.0), $score);
    }

    public function testBlitzMediumLevel(): void
    {
        $score = ScoreCalculator::calculate('blitz', 1, 100.0, 5);
        $this->assertSame((int)((10000 - 100) * 3.0), $score);
    }

    public function testBlitzHardLevel(): void
    {
        $score = ScoreCalculator::calculate('blitz', 1, 200.0, 10);
        $this->assertSame((int)((10000 - 200) * 4.0), $score);
    }

    // ─── Zen mode ────────────────────────────────────────────────────────────

    public function testZenEasyLevel(): void
    {
        // base = 10000 - moves; time is irrelevant
        $score = ScoreCalculator::calculate('zen', 20, 999.0, 3);
        $this->assertSame((int)((10000 - 20) * 0.5), $score);
    }

    public function testZenHardLevel(): void
    {
        $score = ScoreCalculator::calculate('zen', 40, 0.0, 9);
        $this->assertSame((int)((10000 - 40) * 2.0), $score);
    }

    // ─── Unknown mode ────────────────────────────────────────────────────────

    public function testUnknownModeReturns1000WithUnknownDifficulty(): void
    {
        // mode 'candy' is not classic/blitz/zen → base 1000, multiplier 1.0 (unknown difficulty)
        $score = ScoreCalculator::calculate('candy', 5, 5.0, 1);
        $this->assertSame(1000, $score);
    }

    // ─── Floor behaviour ─────────────────────────────────────────────────────

    public function testScoreNeverGoesNegative(): void
    {
        // 10000 - (5000 + 5001) = -1  → floored to 0
        $score = ScoreCalculator::calculate('classic', 5000, 5001.0, 1);
        $this->assertSame(0, $score);
    }

    public function testScoreExactlyZero(): void
    {
        // 10000 - (5000 + 5000) = 0
        $score = ScoreCalculator::calculate('classic', 5000, 5000.0, 1);
        $this->assertSame(0, $score);
    }

    // ─── Unknown level falls back to 'medium' multiplier ─────────────────────

    public function testUnknownLevelFallsBackToMediumMultiplier(): void
    {
        // level 99 is not in the config → difficulty 'medium', multiplier 1.5 for classic
        $score = ScoreCalculator::calculate('classic', 0, 0.0, 99);
        $this->assertSame((int)(10000 * 1.5), $score);
    }

    // ─── Zen with zero moves ──────────────────────────────────────────────────

    public function testZenWithZeroMovesMaxScore(): void
    {
        $score = ScoreCalculator::calculate('zen', 0, 0.0, 1);
        $this->assertSame((int)(10000 * 0.5), $score);
    }
}
