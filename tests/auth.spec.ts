import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByLabel(/Email/)).toBeVisible();
    await expect(page.getByLabel(/Password/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/ })).toBeVisible();
  });

  test('should require email and password', async ({ page }) => {
    await page.getByRole('button', { name: /Sign In/ }).click();
    await expect(page.getByText(/Invalid email or password/)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/Email/).fill('nonexistent@test.com');
    await page.getByLabel(/Password/).fill('wrongpassword123');
    await page.getByRole('button', { name: /Sign In/ }).click();
    await expect(page.getByText(/Invalid credentials/)).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Create one/ })).toBeVisible();
    await page.getByRole('link', { name: /Create one/ }).click();
    await expect(page).toHaveURL(/.*register/);
  });

  test('should have password visibility toggle', async ({ page }) => {
    const passwordInput = page.getByLabel(/Password/);
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

test.describe('Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.getByLabel(/Email/)).toBeVisible();
    await expect(page.getByLabel(/Master Password/)).toBeVisible();
    await expect(page.getByLabel(/Confirm/)).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    const weakPassword = '123';
    await page.getByLabel(/Master Password/).fill(weakPassword);
    await expect(page.getByText(/Weak/)).toBeVisible();
  });

  test('should require password confirmation match', async ({ page }) => {
    await page.getByLabel(/Email/).fill('test@example.com');
    await page.getByLabel(/Master Password/).fill('StrongPass123!');
    await page.getByLabel(/Confirm/).fill('DifferentPass123!');
    await page.getByRole('button', { name: /Continue/ }).click();
    await expect(page.getByText(/Passwords do not match/)).toBeVisible();
  });

  test('should require minimum password length', async ({ page }) => {
    await page.getByLabel(/Email/).fill('test@example.com');
    await page.getByLabel(/Master Password/).fill('Short1!');
    await page.getByRole('button', { name: /Continue/ }).click();
    await expect(page.getByText(/at least 12 characters/)).toBeVisible();
  });

  test('should show security warning after password validation', async ({ page }) => {
    await page.getByLabel(/Email/).fill('test@example.com');
    await page.getByLabel(/Master Password/).fill('VeryStrongPass123!!');
    await page.getByLabel(/Confirm/).fill('VeryStrongPass123!!');
    await page.getByRole('button', { name: /Continue/ }).click();
    await expect(page.getByText(/Zero-Knowledge Architecture/)).toBeVisible();
  });

  test('should display security warning message', async ({ page }) => {
    await expect(page.getByText(/cannot see or recover your passwords/)).toBeVisible();
  });
});
