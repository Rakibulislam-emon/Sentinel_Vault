import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Sentinel Vault/);
  });

  test('should display hero section', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Zero-Knowledge');
  });

  test('should have navigation links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Sign In/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Get Started/ })).toBeVisible();
  });

  test('should display security features', async ({ page }) => {
    await expect(page.getByText(/Zero-Knowledge Encryption/)).toBeVisible();
    await expect(page.getByText(/Military-Grade Security/)).toBeVisible();
    await expect(page.getByText(/Complete Control/)).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: /Sign In/ }).click();
    await expect(page).toHaveURL(/.*login/);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.getByRole('link', { name: /Get Started/ }).click();
    await expect(page).toHaveURL(/.*register/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
  });
});
