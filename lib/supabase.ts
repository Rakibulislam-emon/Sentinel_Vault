import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file."
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          kdf_salt: string;
          verifier_hash: string;
          failed_unlock_attempts: number;
          failed_unlock_locked_until: string | null;
          auto_lock_minutes: number;
          clear_clipboard_seconds: number;
          created_at: string;
          last_login: string | null;
        };
        Insert: {
          id: string;
          email: string;
          kdf_salt: string;
          verifier_hash: string;
          auto_lock_minutes?: number;
          clear_clipboard_seconds?: number;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      vault_items: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          ciphertext: string;
          iv: string;
          auth_tag: string;
          category_id: string | null;
          is_favorite: boolean;
          version: number;
          last_accessed: string;
          last_modified: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          ciphertext: string;
          iv: string;
          auth_tag: string;
          category_id?: string | null;
          is_favorite?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["vault_items"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          color: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          icon?: string;
          color?: string;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          ip_address: string | null;
          user_agent: string | null;
          resource_type: string | null;
          resource_id: string | null;
          metadata: Record<string, unknown> | null;
          timestamp: string;
          success: boolean;
        };
        Insert: {
          user_id: string;
          action: string;
          ip_address?: string | null;
          user_agent?: string | null;
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: Record<string, unknown> | null;
          success?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
    };
  };
}

// Helper functions for common operations
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) throw error;
}

export async function getVaultItems(userId: string) {
  const { data, error } = await supabase
    .from("vault_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createVaultItem(
  userId: string,
  item: Omit<Database["public"]["Tables"]["vault_items"]["Insert"], "user_id">
) {
  const { data, error } = await supabase
    .from("vault_items")
    .insert({ ...item, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVaultItem(
  itemId: string,
  userId: string,
  updates: Partial<Database["public"]["Tables"]["vault_items"]["Insert"]>
) {
  const { error } = await supabase
    .from("vault_items")
    .update(updates)
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteVaultItem(itemId: string, userId: string) {
  const { error } = await supabase
    .from("vault_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function getCategories(userId: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createCategory(
  userId: string,
  category: Omit<
    Database["public"]["Tables"]["categories"]["Insert"],
    "user_id"
  >
) {
  const { data, error } = await supabase
    .from("categories")
    .insert({ ...category, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}
