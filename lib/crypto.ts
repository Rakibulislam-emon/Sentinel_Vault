/**
 * Sentinel Vault Cryptographic Service
 *
 * This module implements all cryptographic operations using the Web Crypto API.
 * All operations occur client-side - the server never sees plaintext passwords or keys.
 *
 * Security Architecture:
 * - PBKDF2 with 600,000 iterations for key derivation
 * - AES-256-GCM for encryption (provides authenticated encryption)
 * - Unique 12-byte IV per encrypted item
 * - Twin keys: Encryption Key and Verification Key derived from master password
 */

const PBKDF2_ITERATIONS = 600000;
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits (recommended for AES-GCM)
const KEY_LENGTH = 256; // bits

/**
 * Convert ArrayBuffer to Base64 string
 */
export function bufferToBase64(
  buffer: ArrayBuffer | ArrayBufferLike | Uint8Array
): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to Uint8Array
 */
export function base64ToBuffer(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes as Uint8Array<ArrayBuffer>;
}

/**
 * Generate a cryptographically secure random salt
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return bufferToBase64(salt);
}

/**
 * Generate a cryptographically secure random IV
 */
export function generateIV(): string {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  return bufferToBase64(iv);
}

/**
 * Derive cryptographic keys from the master password using PBKDF2
 *
 * Returns:
 * - encryptionKey: For encrypting/decrypting vault items
 * - verificationKey: For verifying password without transmitting it
 */
export async function deriveKeys(
  password: string,
  saltBase64: string
): Promise<{ encryptionKey: CryptoKey; verificationKey: string }> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const salt = base64ToBuffer(saltBase64);

  // Derive the master key material (64 bytes = 512 bits)
  const keyMaterialBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    512 // 512 bits = 64 bytes
  );

  const keyBytes = new Uint8Array(keyMaterialBuffer);

  // Split into two 32-byte keys
  const encryptionKeyBytes = keyBytes.slice(0, 32);
  const verificationKeyBytes = keyBytes.slice(32, 64);

  // Create the AES-GCM encryption key
  const encryptionKey = await crypto.subtle.importKey(
    "raw",
    encryptionKeyBytes,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );

  // Hash the verification key for storage (server never sees the actual key)
  const verificationHashBuffer = await crypto.subtle.digest(
    "SHA-256",
    verificationKeyBytes
  );
  const verificationKey = bufferToBase64(verificationHashBuffer);

  return { encryptionKey, verificationKey };
}

/**
 * Derive just the encryption key for vault operations
 */
export async function deriveEncryptionKey(
  password: string,
  saltBase64: string
): Promise<CryptoKey> {
  const { encryptionKey } = await deriveKeys(password, saltBase64);
  return encryptionKey;
}

/**
 * Encrypt plaintext using AES-256-GCM
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey,
  ivBase64?: string
): Promise<{ ciphertext: string; iv: string }> {
  const iv = ivBase64
    ? base64ToBuffer(ivBase64)
    : crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encoder = new TextEncoder();
  const encodedData = encoder.encode(plaintext);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedData
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt ciphertext using AES-256-GCM
 */
export async function decrypt(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<string> {
  const ciphertext = base64ToBuffer(ciphertextBase64);
  const iv = base64ToBuffer(ivBase64);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Encrypt a vault item payload
 */
export interface VaultItemPayload {
  username: string;
  password: string;
  url?: string;
  notes?: string;
}

export async function encryptVaultItem(
  payload: VaultItemPayload,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  return encrypt(JSON.stringify(payload), key);
}

/**
 * Decrypt a vault item payload
 */
export async function decryptVaultItem(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<VaultItemPayload> {
  const decrypted = await decrypt(ciphertextBase64, ivBase64, key);
  return JSON.parse(decrypted);
}

/**
 * Generate a cryptographically secure random password
 */
export function generatePassword(options: {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}): string {
  const {
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
  } = options;

  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let charset = "";
  let result = "";

  // Build charset based on options
  if (includeUppercase) charset += uppercase;
  if (includeLowercase) charset += lowercase;
  if (includeNumbers) charset += numbers;
  if (includeSymbols) charset += symbols;

  if (charset === "") {
    charset = lowercase + numbers;
  }

  // Generate password using crypto.getRandomValues
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }

  return result;
}

/**
 * Estimate password strength (0-100)
 */
export function estimatePasswordStrength(password: string): number {
  let score = 0;

  // Length scoring
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 10;

  // Character variety scoring
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;

  // Entropy bonus
  if (
    password.length >= 16 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)
  ) {
    score += 20;
  }

  return Math.min(score, 100);
}
