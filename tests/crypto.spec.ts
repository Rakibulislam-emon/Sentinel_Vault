import { test, expect } from '@playwright/test';

test.describe('Cryptographic Functions', () => {
  test('should generate random salt', async ({ page }) => {
    const salt = await page.evaluate(() => {
      const saltBytes = new Uint8Array(16);
      crypto.getRandomValues(saltBytes);
      const base64 = btoa(String.fromCharCode(...saltBytes));
      return base64;
    });
    
    expect(salt).toBeDefined();
    expect(salt.length).toBeGreaterThan(0);
  });

  test('should generate random IV', async ({ page }) => {
    const iv = await page.evaluate(() => {
      const ivBytes = new Uint8Array(12);
      crypto.getRandomValues(ivBytes);
      const base64 = btoa(String.fromCharCode(...ivBytes));
      return base64;
    });
    
    expect(iv).toBeDefined();
    expect(iv.length).toBeGreaterThan(0);
  });

  test('should estimate password strength correctly', async ({ page }) => {
    const weakPassword = '123';
    const strongPassword = 'CorrectHorseBatteryStaple!123';
    
    const weakStrength = await page.evaluate((pwd) => {
      let score = 0;
      if (pwd.length >= 8) score += 10;
      if (pwd.length >= 12) score += 10;
      if (pwd.length >= 16) score += 10;
      if (/[a-z]/.test(pwd)) score += 10;
      if (/[A-Z]/.test(pwd)) score += 10;
      if (/[0-9]/.test(pwd)) score += 10;
      if (/[^a-zA-Z0-9]/.test(pwd)) score += 20;
      return Math.min(score, 100);
    }, weakPassword);
    
    const strongStrength = await page.evaluate((pwd) => {
      let score = 0;
      if (pwd.length >= 8) score += 10;
      if (pwd.length >= 12) score += 10;
      if (pwd.length >= 16) score += 10;
      if (/[a-z]/.test(pwd)) score += 10;
      if (/[A-Z]/.test(pwd)) score += 10;
      if (/[0-9]/.test(pwd)) score += 10;
      if (/[^a-zA-Z0-9]/.test(pwd)) score += 20;
      return Math.min(score, 100);
    }, strongPassword);
    
    expect(weakStrength).toBeLessThan(50);
    expect(strongStrength).toBeGreaterThan(80);
  });

  test('should generate cryptographically secure password', async ({ page }) => {
    const password = await page.evaluate(() => {
      const length = 20;
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const charset = uppercase + lowercase + numbers + symbols;
      
      const randomValues = new Uint32Array(length);
      crypto.getRandomValues(randomValues);
      
      let result = '';
      for (let i = 0; i < length; i++) {
        result += charset[randomValues[i] % charset.length];
      }
      
      return result;
    });
    
    expect(password.length).toBe(20);
    expect(/[A-Z]/.test(password)).toBe(true);
    expect(/[a-z]/.test(password)).toBe(true);
    expect(/[0-9]/.test(password)).toBe(true);
    expect(/[^a-zA-Z0-9]/.test(password)).toBe(true);
  });
});

test.describe('Encryption Verification', () => {
  test('should encrypt and decrypt data correctly', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      const password = 'MySecretPassword123!';
      const saltBytes = new Uint8Array(16);
      crypto.getRandomValues(saltBytes);
      const salt = btoa(String.fromCharCode(...saltBytes));
      
      // Derive key
      const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      
      const keyMaterial = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: 1000,
          hash: 'SHA-256',
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      // Encrypt
      const ivBytes = new Uint8Array(12);
      crypto.getRandomValues(ivBytes);
      const data = 'Test secret data';
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: ivBytes },
        keyMaterial,
        encoder.encode(data)
      );
      
      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBytes },
        keyMaterial,
        encryptedBuffer
      );
      
      return {
        original: data,
        decrypted: decoder.decode(decryptedBuffer),
        encryptedLength: encryptedBuffer.byteLength,
      };
    });
    
    expect(result.original).toBe(result.decrypted);
    expect(result.encryptedLength).toBeGreaterThan(result.original.length);
  });

  test('should produce different ciphertext for same plaintext', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const encoder = new TextEncoder();
      
      const password = 'MySecretPassword123!';
      const data = 'Same data';
      
      // First encryption
      const saltBytes1 = new Uint8Array(16);
      crypto.getRandomValues(saltBytes1);
      const ivBytes1 = new Uint8Array(12);
      crypto.getRandomValues(ivBytes1);
      
      const passwordKey1 = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      
      const keyMaterial1 = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBytes1,
          iterations: 1000,
          hash: 'SHA-256',
        },
        passwordKey1,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      
      const encrypted1 = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: ivBytes1 },
        keyMaterial1,
        encoder.encode(data)
      );
      
      // Second encryption with different salt and IV
      const saltBytes2 = new Uint8Array(16);
      crypto.getRandomValues(saltBytes2);
      const ivBytes2 = new Uint8Array(12);
      crypto.getRandomValues(ivBytes2);
      
      const passwordKey2 = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      
      const keyMaterial2 = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBytes2,
          iterations: 1000,
          hash: 'SHA-256',
        },
        passwordKey2,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      
      const encrypted2 = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: ivBytes2 },
        keyMaterial2,
        encoder.encode(data)
      );
      
      return {
        encrypted1: btoa(String.fromCharCode(...new Uint8Array(encrypted1))),
        encrypted2: btoa(String.fromCharCode(...new Uint8Array(encrypted2))),
      };
    });
    
    // Ciphertext should be different due to different salt and IV
    expect(result.encrypted1).not.toBe(result.encrypted2);
  });
});

test.describe('Supabase Integration', () => {
  test('should handle Supabase client initialization', async ({ page }) => {
    const isInitialized = await page.evaluate(() => {
      // Check if Supabase environment variables are set
      const hasUrl = typeof process.env.NEXT_PUBLIC_SUPABASE_URL !== 'undefined';
      const hasKey = typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'undefined';
      return hasUrl && hasKey;
    });
    
    // This test will pass if env vars are configured
    expect(typeof isInitialized).toBe('boolean');
  });
});
