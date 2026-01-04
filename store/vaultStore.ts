import { create } from 'zustand';

export interface VaultItem {
  id: string;
  title: string;
  ciphertext: string;
  iv: string;
  auth_tag: string;
  category_id: string | null;
  is_favorite: boolean;
  last_accessed: string;
  last_modified: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
}

export interface DecryptedVaultItem extends VaultItem {
  username: string;
  password: string;
  url?: string;
  notes?: string;
}

interface VaultState {
  // Authentication state
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  
  // Encryption state (keys only in memory, never persisted)
  encryptionKey: CryptoKey | null;
  salt: string | null;
  isUnlocked: boolean;
  
  // Vault data (decrypted in memory only)
  items: DecryptedVaultItem[];
  categories: Category[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // User preferences
  autoLockMinutes: number;
  clearClipboardSeconds: number;
  
  // Actions
  setAuthenticated: (userId: string, email: string) => void;
  setUnlocked: (key: CryptoKey, salt: string) => void;
  setVaultData: (items: DecryptedVaultItem[], categories: Category[]) => void;
  addItem: (item: DecryptedVaultItem) => void;
  updateItem: (id: string, updates: Partial<DecryptedVaultItem>) => void;
  removeItem: (id: string) => void;
  setPreferences: (autoLockMinutes: number, clearClipboardSeconds: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  lockVault: () => void;
  logout: () => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  // Initial state
  isAuthenticated: false,
  userId: null,
  email: null,
  encryptionKey: null,
  salt: null,
  isUnlocked: false,
  items: [],
  categories: [],
  isLoading: false,
  error: null,
  autoLockMinutes: 5,
  clearClipboardSeconds: 30,
  
  // Actions
  setAuthenticated: (userId, email) => set({ 
    isAuthenticated: true, 
    userId, 
    email 
  }),
  
  setUnlocked: (key, salt) => set({ 
    encryptionKey: key, 
    salt, 
    isUnlocked: true 
  }),
  
  setVaultData: (items, categories) => set({ items, categories }),
  
  addItem: (item) => set((state) => ({ 
    items: [item, ...state.items] 
  })),
  
  updateItem: (id, updates) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
  })),
  
  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
  })),
  
  setPreferences: (autoLockMinutes, clearClipboardSeconds) => set({ 
    autoLockMinutes, 
    clearClipboardSeconds 
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  lockVault: () => set({
    encryptionKey: null,
    salt: null,
    isUnlocked: false,
    items: [],
  }),
  
  logout: () => set({
    isAuthenticated: false,
    userId: null,
    email: null,
    encryptionKey: null,
    salt: null,
    isUnlocked: false,
    items: [],
    categories: [],
  }),
}));
