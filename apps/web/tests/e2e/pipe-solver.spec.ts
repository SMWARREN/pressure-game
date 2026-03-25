import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

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

// Cleanup hook: destroy the game store after each test to prevent listener accumulation
test.afterEach(async ({ page }) => {
  try {
    // Only try cleanup if page is actually loaded
    const url = page.url();
    if (url && url !== 'about:blank') {
      // Use Promise.race to add a timeout to avoid hanging on failed page loads
      await Promise.race([
        page.evaluate(() => {
          if (typeof (window as any).__DESTROY_GAME_STORE__ === 'function') {
            (window as any).__DESTROY_GAME_STORE__();
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Cleanup timeout')), 2000)),
      ]);
    }
  } catch (e) {
    // Page might have failed to load or navigated away - skip cleanup
  }
});

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
        // Use domcontentloaded instead of networkidle - much faster and more reliable
        await page.goto(`/?levelId=${sol.levelId}&modeId=${sol.modeId}`, {
          waitUntil: 'domcontentloaded',
        });

        // Wait for game grid to appear (the grid renders when level is loaded)
        await page.waitForSelector('[data-testid="game-grid"]', { timeout: 15000 });

        // Wait for the level to be loaded into idle state by TestHarness
        // This is the key wait - the game must be ready before we interact
        await page.waitForFunction(
          () => {
            const store = (window as any).__GAME_STORE__;
            const state = store?.getState?.();
            // Check for idle status AND that tiles are loaded
            return (
              (state?.status === 'idle' || state?.status === 'menu') &&
              state?.tiles?.length > 0
            );
          },
          { timeout: 15000 }
        );

        // Disable animations before starting — avoids waiting for animation frames
        await page.evaluate(() => {
          const store = (window as any).__GAME_STORE__;
          const state = store?.getState?.();
          if (state?.animationsEnabled && typeof state.toggleAnimations === 'function') {
            state.toggleAnimations();
          }
        });

        // Now start the game — wall timer begins HERE, not during page load
        await page.evaluate(() => {
          const store = (window as any).__GAME_STORE__;
          store?.getState?.().startGame?.();
        });

        // Wait for game to actually be in 'playing' status (overlay should be gone)
        await page.waitForFunction(
          () => {
            const store = (window as any).__GAME_STORE__;
            const state = store?.getState?.();
            return state?.status === 'playing';
          },
          { timeout: 5000 }
        );

        // Take screenshot of initial board state
        await page.screenshot({ path: `${screenshotDir}/step-00-initial.png` });

        // Click each move in sequence and capture screenshots
        for (let i = 0; i < sol.moves.length; i++) {
          const { x, y } = sol.moves[i];

          // Click the tile
          await page.locator(`[data-testid="tile-${x}-${y}"]`).click({ timeout: 5000 });

          // Wait for tile rotation animation to complete
          await page.waitForTimeout(100);

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
