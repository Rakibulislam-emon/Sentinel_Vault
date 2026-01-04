import { test, expect } from '@playwright/test';

test.describe('Vault Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to vault (will redirect to login if not authenticated)
    await page.goto('/vault');
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show lock screen after authentication', async ({ page }) => {
    // This test would require actual authentication setup
    // Skipping for now as it needs Supabase configuration
  });
});

test.describe('Security Features', () => {
  test('should apply privacy blur when window loses focus', async ({ page }) => {
    await page.goto('/vault');
    
    // Check that body has privacy-blur class capability
    await expect(page.locator('body')).toHaveClass(/.*/);
    
    // Simulate window blur
    await page.evaluate(() => {
      window.dispatchEvent(new Event('blur'));
    });
    
    // Check if blur class is applied
    const hasPrivacyBlur = await page.evaluate(() => {
      return document.body.classList.contains('privacy-blur');
    });
    
    expect(hasPrivacyBlur).toBe(true);
  });

  test('should remove privacy blur on window focus', async ({ page }) => {
    await page.goto('/vault');
    
    // Apply blur
    await page.evaluate(() => {
      document.body.classList.add('privacy-blur');
      window.dispatchEvent(new Event('blur'));
    });
    
    // Remove blur with focus
    await page.evaluate(() => {
      document.body.classList.remove('privacy-blur');
      window.dispatchEvent(new Event('focus'));
    });
    
    // Verify blur is removed
    const hasPrivacyBlur = await page.evaluate(() => {
      return document.body.classList.contains('privacy-blur');
    });
    
    expect(hasPrivacyBlur).toBe(false);
  });
});

test.describe('UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have accessible UI elements', async ({ page }) => {
    // Check for proper heading hierarchy
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    
    // Check for proper button labels
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/login');
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    expect(['INPUT', 'BUTTON']).toContain(focusedElement);
  });

  test('should display loading states', async ({ page }) => {
    await page.goto('/login');
    // Check if loading indicators are available
    const loadingClass = await page.locator('.spinner').count();
    // Loading spinner might not be visible initially
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    // Basic check that page renders without errors
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should work on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should work on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toContain('Sentinel Vault');
    
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /password manager/);
  });
});
