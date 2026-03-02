import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Hook to cleanup between tests
test.afterEach(async ({ page }) => {
  // Destroy the game store to prevent listener accumulation and memory leaks
  try {
    await page.evaluate(() => {
      if (typeof (window as any).__DESTROY_GAME_STORE__ === 'function') {
        (window as any).__DESTROY_GAME_STORE__();
      }
    });
  } catch (e) {
    // Cleanup failed - continue anyway
  }
});

interface Solution {
  modeId: string;
  levelId: number;
  levelName: string;
  status: 'won' | 'no_solution' | 'impossible';
  moves: { x: number; y: number }[];
}

// Load solutions - will be created by npm run solve:json
let solutionsRaw: Solution[] = [];
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const solutionsPath = resolve(__dirname, '..', 'fixtures', 'solutions.json');

if (existsSync(solutionsPath)) {
  try {
    const content = readFileSync(solutionsPath, 'utf-8');
    solutionsRaw = JSON.parse(content) as Solution[];
  } catch (err) {
    console.warn(`Failed to load solutions from ${solutionsPath}:`, err);
  }
} else {
  console.warn(`Solutions file not found at ${solutionsPath}. Run: npm run solve:json first`);
}

const solutions = solutionsRaw.filter((s: Solution) => s.status === 'won');

// Support filtering by mode via environment variable or grep
const MODE_FILTER = process.env.TEST_MODE?.toLowerCase();

if (solutions.length === 0) {
  // No solutions available - add a placeholder test
  test('skip: solutions.json not generated', () => {
    test.skip(true, 'Run: npm run solve:json');
  });
} else {
  // Group tests by mode for better organization
  const solutionsByMode: { [key: string]: Solution[] } = {};
  for (const sol of solutions) {
    if (!solutionsByMode[sol.modeId]) {
      solutionsByMode[sol.modeId] = [];
    }
    solutionsByMode[sol.modeId].push(sol);
  }

  // Create tests for each solution
  for (const modeId of Object.keys(solutionsByMode)) {
    // Skip modes not matching filter (if TEST_MODE is set)
    if (MODE_FILTER && !modeId.toLowerCase().includes(MODE_FILTER)) {
      continue;
    }

    const modeSolutions = solutionsByMode[modeId];
    test.describe(`[${modeId.toUpperCase()}] Pipe Solver`, () => {
      for (const sol of modeSolutions) {
        test(`Level ${sol.levelId} "${sol.levelName}"`, async ({ page }) => {
        const screenshotDir = `tests/screenshots/${sol.modeId}/level-${sol.levelId}`;

        // Create screenshot directory if it doesn't exist
        try {
          mkdirSync(dirname(screenshotDir), { recursive: true });
        } catch {
          // Directory already exists
        }

        // Navigate to the level with TestHarness parameters
        await page.goto(`/?levelId=${sol.levelId}&modeId=${sol.modeId}`);

        // Wait for page to be fully loaded (no more network activity)
        await page.waitForLoadState('networkidle', { timeout: 20000 });

        // Wait for game grid to appear (increased timeout)
        await page.waitForSelector('[data-testid="game-grid"]', { timeout: 20000 });

        // Give TestHarness + React time to fully initialize and render
        await page.waitForTimeout(1500);

        // Aggressively dismiss tutorial and start game
        // Try up to 5 times in case state changes take time
        for (let attempt = 0; attempt < 5; attempt++) {
          await page.evaluate(() => {
            const store = (window as any).__GAME_STORE__;
            if (store && store.getState) {
              const state = store.getState();

              // If in tutorial, complete it
              if (state.status === 'tutorial' && typeof state.completeTutorial === 'function') {
                state.completeTutorial();
              }

              // If in menu/idle and game is ready, start it
              if ((state.status === 'menu' || state.status === 'idle') && typeof state.startGame === 'function') {
                state.startGame();
              }
            }
          });

          // Skip any walkthrough that might be showing
          const skipBtn = page.locator('button:has-text("Skip")').first();
          if (await skipBtn.isVisible({ timeout: 500 }).catch(() => false)) {
            await skipBtn.click({ timeout: 5000 });
          }

          await page.waitForTimeout(300);
        }

        // Extra wait for all state changes to settle
        await page.waitForTimeout(800);

        // Verify game grid is visible and in playing state
        await page.waitForSelector('[data-testid="game-grid"]', { state: 'visible', timeout: 5000 });

        // Extra wait to ensure everything is rendered
        await page.waitForTimeout(1000);

        // Disable animations via Zustand store to speed up tests
        await page.evaluate(() => {
          const store = (window as any).__GAME_STORE__;
          if (store && store.getState && typeof store.getState().toggleAnimations === 'function') {
            // If animations are enabled, disable them
            const state = store.getState();
            if (state.animationsEnabled) {
              state.toggleAnimations();
            }
          }
        });

        // Final wait before first screenshot
        await page.waitForTimeout(500);

        // Take screenshot of initial board state
        await page.screenshot({ path: `${screenshotDir}/step-00-initial.png` });

        // Click each move in sequence and capture screenshots
        for (let i = 0; i < sol.moves.length; i++) {
          const { x, y } = sol.moves[i];

          // Click the tile (increased timeout)
          await page.locator(`[data-testid="tile-${x}-${y}"]`).click({ timeout: 5000 });

          // Wait for interaction (increased from 150ms)
          await page.waitForTimeout(250);

          // Take screenshot after the click
          const stepNum = String(i + 1).padStart(2, '0');
          await page.screenshot({ path: `${screenshotDir}/step-${stepNum}-click-${x}-${y}.png` });
        }

        // Assert that win overlay appeared
        await expect(page.locator('[data-testid="win-overlay"]')).toBeVisible({ timeout: 3000 });

        // Capture final win state
        await page.screenshot({ path: `${screenshotDir}/step-final-win.png` });
        });
      }
    });
  }
}
