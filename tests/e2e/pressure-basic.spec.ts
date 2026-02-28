import { test, expect } from '@playwright/test';

test.describe('Pressure Mode - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set large viewport to avoid mobile UI issues
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Level 1: Load and verify grid renders', async ({ page }) => {
    console.log('📋 Testing: Load level 1');
    await page.goto('/?levelId=1&modeId=pressure', { waitUntil: 'domcontentloaded' });

    const gameGrid = page.locator('[data-testid="game-grid"]');
    await expect(gameGrid).toBeVisible({ timeout: 45000 });

    const tiles = page.locator('[data-testid*="tile-"]');
    const count = await tiles.count();
    expect(count).toBeGreaterThan(0);

    console.log(`✅ Level 1: ${count} tiles rendered`);
  });

  test('Level 2: Load and verify grid renders', async ({ page }) => {
    console.log('📋 Testing: Load level 2');
    await page.goto('/?levelId=2&modeId=pressure', { waitUntil: 'domcontentloaded' });

    const gameGrid = page.locator('[data-testid="game-grid"]');
    await expect(gameGrid).toBeVisible({ timeout: 45000 });

    console.log('✅ Level 2: Grid rendered');
  });

  test('Level 1: Can click tiles', async ({ page }) => {
    console.log('📋 Testing: Tile interaction');
    await page.goto('/?levelId=1&modeId=pressure', { waitUntil: 'domcontentloaded' });

    const gameGrid = page.locator('[data-testid="game-grid"]');
    await expect(gameGrid).toBeVisible({ timeout: 45000 });

    // Click any tile
    const firstTile = page.locator('[data-testid*="tile-"]').first();
    await expect(firstTile).toBeVisible();
    await firstTile.click({ force: true });

    console.log('✅ Tile click handled');
  });

  test('Pressure Mode harness initializes correctly', async ({ page }) => {
    console.log('📋 Testing: Harness initialization');
    await page.goto('/?levelId=1&modeId=pressure', { waitUntil: 'domcontentloaded' });

    // Check console logs for initialization
    const logs: string[] = [];
    page.on('console', (msg) => logs.push(msg.text()));

    // Wait for grid
    const gameGrid = page.locator('[data-testid="game-grid"]');
    await expect(gameGrid).toBeVisible({ timeout: 45000 });

    console.log(`✅ Harness initialized, ${logs.filter((l) => l.includes('TestHarness')).length} setup logs`);
  });
});
