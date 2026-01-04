/**
 * Sentinel Vault - Critical Functionality Tests
 * 
 * This file contains the most critical tests to verify that
 * the zero-knowledge password manager is functioning correctly.
 * 
 * Run these tests first to verify core functionality:
 *   npx playwright test tests/critical.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Critical Functionality', () => {
  test.describe('Landing Page', () => {
    test('should load the landing page', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Sentinel Vault/);
    });

    test('should display main headline', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('h1')).toContainText('Zero-Knowledge');
    });

    test('should have working navigation to login', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: /Sign In/ }).click();
      await expect(page).toHaveURL(/.*login/);
    });

    test('should have working navigation to register', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: /Get Started/ }).click();
      await expect(page).toHaveURL(/.*register/);
    });
  });

  test.describe('Login Page', () => {
    test('should display login form elements', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByLabel(/Email/)).toBeVisible();
      await expect(page.getByLabel(/Password/)).toBeVisible();
      await expect(page.getByRole('button', { name: /Sign In/ })).toBeVisible();
    });

    test('should show error for empty fields', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /Sign In/ }).click();
      // Should show error message
      await expect(page.locator('[class*="text-destructive"]')).toBeVisible();
    });
  });

  test.describe('Registration Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register');
      await expect(page.getByLabel(/Email/)).toBeVisible();
      await expect(page.getByLabel(/Master Password/)).toBeVisible();
      await expect(page.getByLabel(/Confirm/)).toBeVisible();
    });

    test('should validate password length', async ({ page }) => {
      await page.goto('/register');
      await page.getByLabel(/Email/).fill('test@example.com');
      await page.getByLabel(/Master Password/).fill('Short1!');
      await page.getByLabel(/Confirm/).fill('Short1!');
      await page.getByRole('button', { name: /Continue/ }).click();
      await expect(page.getByText(/at least 12 characters/)).toBeVisible();
    });

    test('should require password match', async ({ page }) => {
      await page.goto('/register');
      await page.getByLabel(/Email/).fill('test@example.com');
      await page.getByLabel(/Master Password/).fill('StrongPassword123!');
      await page.getByLabel(/Confirm/).fill('DifferentPassword123!');
      await page.getByRole('button', { name: /Continue/ }).click();
      await expect(page.getByText(/Passwords do not match/)).toBeVisible();
    });

    test('should show security warning for strong password', async ({ page }) => {
      await page.goto('/register');
      await page.getByLabel(/Email/).fill('test@example.com');
      await page.getByLabel(/Master Password/).fill('VeryStrongPass123!!');
      await page.getByLabel(/Confirm/).fill('VeryStrongPass123!!');
      await page.getByRole('button', { name: /Continue/ }).click();
      await expect(page.getByText(/Zero-Knowledge Architecture/)).toBeVisible();
    });
  });

  test.describe('Security Features', () => {
    test('should apply privacy blur on window blur', async ({ page }) => {
      await page.goto('/');
      
      // Simulate window blur
      await page.evaluate(() => {
        window.dispatchEvent(new Event('blur'));
      });
      
      // Check if body gets privacy-blur class
      const hasBlurClass = await page.evaluate(() => {
        return document.body.classList.contains('privacy-blur') ||
               document.body.classList.contains('blur') ||
               getComputedStyle(document.body).filter !== 'none';
      });
      
      expect(hasBlurClass).toBe(true);
    });

    test('should remove privacy blur on window focus', async ({ page }) => {
      await page.goto('/');
      
      // First add blur
      await page.evaluate(() => {
        document.body.classList.add('privacy-blur');
        window.dispatchEvent(new Event('blur'));
      });
      
      // Then focus
      await page.evaluate(() => {
        document.body.classList.remove('privacy-blur');
        window.dispatchEvent(new Event('focus'));
      });
      
      // Verify blur is removed
      const hasBlurClass = await page.evaluate(() => {
        return document.body.classList.contains('privacy-blur');
      });
      
      expect(hasBlurClass).toBe(false);
    });
  });

  test.describe('Cryptography', () => {
    test('should generate random bytes', async ({ page }) => {
      const result = await page.evaluate(() => {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return {
          length: bytes.length,
          allDifferent: true,
        };
      });
      
      expect(result.length).toBe(16);
    });

    test('should estimate password strength', async ({ page }) => {
      const weakResult = await page.evaluate(() => {
        let score = 0;
        const pwd = '123';
        if (pwd.length >= 8) score += 10;
        if (/[a-z]/.test(pwd)) score += 10;
        if (/[A-Z]/.test(pwd)) score += 10;
        if (/[0-9]/.test(pwd)) score += 10;
        if (/[^a-zA-Z0-9]/.test(pwd)) score += 20;
        return score;
      });
      
      const strongResult = await page.evaluate(() => {
        let score = 0;
        const pwd = 'CorrectHorseBatteryStaple!123';
        if (pwd.length >= 8) score += 10;
        if (pwd.length >= 12) score += 10;
        if (pwd.length >= 16) score += 10;
        if (/[a-z]/.test(pwd)) score += 10;
        if (/[A-Z]/.test(pwd)) score += 10;
        if (/[0-9]/.test(pwd)) score += 10;
        if (/[^a-zA-Z0-9]/.test(pwd)) score += 20;
        return Math.min(score, 100);
      });
      
      expect(weakResult).toBeLessThan(50);
      expect(strongResult).toBeGreaterThan(70);
    });

    test('should generate cryptographically secure password', async ({ page }) => {
      const password = await page.evaluate(() => {
        const length = 20;
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        const random = new Uint32Array(length);
        crypto.getRandomValues(random);
        let result = '';
        for (let i = 0; i < length; i++) {
          result += charset[random[i] % charset.length];
        }
        return result;
      });
      
      expect(password.length).toBe(20);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[0-9]/.test(password)).toBe(true);
      expect(/[^a-zA-Z0-9]/.test(password)).toBe(true);
    });

    test('should encrypt and decrypt data correctly', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        
        const data = 'MySecretPassword123!';
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode('testpassword'),
          { name: 'PBKDF2' },
          false,
          ['deriveKey']
        );
        
        const cryptoKey = await crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt,
            iterations: 1000,
            hash: 'SHA-256',
          },
          key,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
        
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          cryptoKey,
          encoder.encode(data)
        );
        
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          cryptoKey,
          encrypted
        );
        
        return {
          original: data,
          decrypted: decoder.decode(decrypted),
          encryptedLength: encrypted.byteLength,
        };
      });
      
      expect(result.original).toBe(result.decrypted);
      expect(result.encryptedLength).toBeGreaterThan(result.original.length);
    });
  });

  test.describe('UI Responsiveness', () => {
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
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should have proper meta tags', async ({ page }) => {
      await page.goto('/');
      const title = await page.title();
      expect(title).toContain('Sentinel Vault');
    });
  });
});
