import { test, expect } from '@playwright/test';

test.describe('App Loading', () => {
  test('homepage loads successfully', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');

    // Verify the page title contains Family Feud
    await expect(page).toHaveTitle(/Family Feud/);

    // Verify main heading is visible
    await expect(page.getByRole('heading', { name: /Family Feud Online/i })).toBeVisible();

    // Verify the Create Game section is present
    await expect(page.getByRole('heading', { name: /Create Game/i })).toBeVisible();

    // Verify the Join Game section is present
    await expect(page.getByRole('heading', { name: /Join Game/i })).toBeVisible();

    // Verify Create Game button is clickable
    const createButton = page.getByRole('button', { name: /Create Free Game/i });
    await expect(createButton).toBeVisible();
    await expect(createButton).toBeEnabled();

    // Verify Join Game button is present
    const joinButton = page.getByRole('button', { name: /Join Game/i });
    await expect(joinButton).toBeVisible();

    // Verify game code input field exists
    const codeInput = page.getByPlaceholder('ABCD');
    await expect(codeInput).toBeVisible();

    // Verify game mode radio buttons exist
    await expect(page.getByText('Auto Advance')).toBeVisible();
    await expect(page.getByText('Host Controlled')).toBeVisible();
  });

  test('navigation bar is present', async ({ page }) => {
    await page.goto('/');

    // Verify navbar with Family Feud brand link
    const navBrand = page.getByRole('link', { name: /Family Feud/i });
    await expect(navBrand).toBeVisible();
  });

  test('page has no JavaScript errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // Assert no JavaScript errors occurred
    expect(errors).toHaveLength(0);
  });

  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // Page should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('responsive design - mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Verify main elements are still visible on mobile
    await expect(page.getByRole('heading', { name: /Family Feud Online/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Free Game/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Join Game/i })).toBeVisible();
  });

  test('game code input accepts valid input', async ({ page }) => {
    await page.goto('/');

    const codeInput = page.getByPlaceholder('ABCD');

    // Type a game code
    await codeInput.fill('test');

    // Verify input is uppercase (as per the app logic)
    await expect(codeInput).toHaveValue('TEST');
  });

  test('game mode selection works', async ({ page }) => {
    await page.goto('/');

    // Find and click Host Controlled radio
    const hostRadio = page.getByRole('radio', { name: /Host Controlled/i });
    await hostRadio.click();
    await expect(hostRadio).toBeChecked();

    // Switch back to Auto Advance
    const autoRadio = page.getByRole('radio', { name: /Auto Advance/i });
    await autoRadio.click();
    await expect(autoRadio).toBeChecked();
  });
});
