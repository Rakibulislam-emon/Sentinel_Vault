"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  Unlock,
  Plus,
  Search,
  LogOut,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Edit2,
  Star,
  StarOff,
  Loader2,
  Check,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useVaultStore, DecryptedVaultItem } from "@/store/vaultStore";
import { supabase, getProfile, getVaultItems } from "@/lib/supabase";
import {
  deriveEncryptionKey,
  encryptVaultItem,
  decryptVaultItem,
  VaultItemPayload,
} from "@/lib/crypto";
import AddItemDialog from "@/components/vault/AddItemDialog";
import EditItemDialog from "@/components/vault/EditItemDialog";
import SettingsDialog from "@/components/vault/SettingsDialog";

export default function VaultPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    userId,
    email,
    isUnlocked,
    encryptionKey,
    items,
    setAuthenticated,
    setUnlocked,
    setVaultData,
    addItem,
    removeItem,
    updateItem,
    lockVault,
    logout,
  } = useVaultStore();

  const [showPassword, setShowPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<DecryptedVaultItem | null>(
    null
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<
    Record<string, string>
  >({});
  const [copyFeedback, setCopyFeedback] = useState<Record<string, boolean>>({});
  const [autoLockMinutes] = useState(5);
  const idleTimeRef = useRef(0);

  const handleLock = useCallback(() => {
    lockVault();
    setRevealedPasswords({});
  }, [lockVault]);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setAuthenticated(session.user.id, session.user.email || "");
    };
    checkAuth();
  }, [router, setAuthenticated]);

  // Idle timer for auto-lock
  useEffect(() => {
    if (!isUnlocked) return;

    const resetTimer = () => {
      idleTimeRef.current = 0;
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    const idleTimer = setInterval(() => {
      idleTimeRef.current += 1;
      if (idleTimeRef.current >= autoLockMinutes * 60) {
        handleLock();
        idleTimeRef.current = 0;
      }
    }, 1000);

    return () => {
      clearInterval(idleTimer);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isUnlocked, autoLockMinutes, handleLock]);

  // Privacy blur on window blur
  useEffect(() => {
    const handleBlur = () => {
      if (isUnlocked) {
        document.body.classList.add("privacy-blur");
      }
    };

    const handleFocus = () => {
      document.body.classList.remove("privacy-blur");
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.body.classList.remove("privacy-blur");
    };
  }, [isUnlocked]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!userId) throw new Error("Not authenticated");

      // Fetch user profile to get salt
      const profile = await getProfile(userId);

      // Check if account is locked
      if (profile.failed_unlock_locked_until) {
        const lockedUntil = new Date(profile.failed_unlock_locked_until);
        if (lockedUntil > new Date()) {
          const minutes = Math.ceil(
            (lockedUntil.getTime() - Date.now()) / 60000
          );
          throw new Error(`Account locked. Try again in ${minutes} minutes.`);
        }
      }

      // Derive encryption key locally
      const key = await deriveEncryptionKey(showPassword, profile.kdf_salt);

      // Fetch and decrypt vault items
      const vaultItems = await getVaultItems(userId);
      const decryptedItems: DecryptedVaultItem[] = [];

      for (const item of vaultItems) {
        try {
          const payload = await decryptVaultItem(item.ciphertext, item.iv, key);
          decryptedItems.push({
            ...item,
            username: payload.username,
            password: payload.password,
            url: payload.url,
            notes: payload.notes,
          });
        } catch {
          console.error("Failed to decrypt item:", item.id);
        }
      }

      setUnlocked(key, profile.kdf_salt);
      setVaultData(decryptedItems, []);
      setShowPassword("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unlock failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    router.push("/login");
  };

  const handleCopyPassword = async (itemId: string, password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopyFeedback((prev) => ({ ...prev, [itemId]: true }));
      setTimeout(() => {
        setCopyFeedback((prev) => ({ ...prev, [itemId]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleRevealPassword = async (item: DecryptedVaultItem) => {
    setRevealedPasswords((prev) => ({ ...prev, [item.id]: item.password }));
  };

  const handleHidePassword = (itemId: string) => {
    setRevealedPasswords((prev) => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  };

  const handleToggleFavorite = async (
    itemId: string,
    currentStatus: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("vault_items")
        .update({ is_favorite: !currentStatus })
        .eq("id", itemId)
        .eq("user_id", userId!);

      if (error) throw error;

      updateItem(itemId, { is_favorite: !currentStatus });
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleUpdateItem = async (
    data: VaultItemPayload & { title: string }
  ) => {
    if (!selectedItem || !encryptionKey) return;

    try {
      const { ciphertext, iv } = await encryptVaultItem(data, encryptionKey);

      const { error } = await supabase
        .from("vault_items")
        .update({
          title: data.title,
          ciphertext,
          iv,
          last_modified: new Date().toISOString(),
        })
        .eq("id", selectedItem.id)
        .eq("user_id", userId!);

      if (error) throw error;

      updateItem(selectedItem.id, {
        title: data.title,
        ciphertext,
        iv,
        username: data.username,
        password: data.password,
        url: data.url,
        notes: data.notes,
        last_modified: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to update item:", err);
      setError("Failed to update item");
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show unlock screen if not unlocked
  if (isAuthenticated && !isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full">
              <Lock className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Unlock Your Vault</CardTitle>
            <CardDescription>
              Enter your master password to decrypt your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="masterPassword">Master Password</Label>
                <Input
                  id="masterPassword"
                  type="password"
                  placeholder="Enter your master password"
                  value={showPassword}
                  onChange={(e) => setShowPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deriving Keys...
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Unlock Vault
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center">
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary flex-shrink-0" />
              <div className="overflow-hidden">
                <h1 className="font-bold whitespace-nowrap">Sentinel Vault</h1>
                <p className="text-xs text-muted-foreground hidden sm:block truncate max-w-[150px]">
                  {email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettingsDialog(true)}
                className="px-2 sm:px-4"
              >
                <Settings className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLock}
                className="px-2 sm:px-4"
              >
                <Lock className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Lock</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="px-2 sm:px-3"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vault items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Vault Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {searchQuery ? "No items found" : "Your vault is empty"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try a different search term"
                : "Add your first password to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="card-hover cursor-pointer"
                onClick={() => {
                  setSelectedItem(item);
                  setShowEditDialog(true);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {item.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {item.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {item.username}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-yellow-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(item.id, item.is_favorite);
                        }}
                      >
                        {item.is_favorite ? (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <StarOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(item.id);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {revealedPasswords[item.id] ? (
                        <>
                          <span className="font-mono">
                            {revealedPasswords[item.id]}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleHidePassword(item.id);
                            }}
                          >
                            <EyeOff className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="font-mono">••••••••••••</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRevealPassword(item);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyPassword(item.id, item.password);
                      }}
                    >
                      {copyFeedback[item.id] ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add Item Dialog */}
      <AddItemDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={async (data) => {
          if (!encryptionKey) return;
          const { ciphertext, iv } = await encryptVaultItem(
            data,
            encryptionKey
          );

          const { error: insertError } = await supabase
            .from("vault_items")
            .insert({
              user_id: userId!,
              title: data.title,
              ciphertext,
              iv,
              auth_tag: "",
            });

          if (insertError) throw insertError;

          // Add to local state
          addItem({
            id: crypto.randomUUID(),
            title: data.title,
            ciphertext,
            iv,
            auth_tag: "",
            category_id: null,
            is_favorite: false,
            last_accessed: new Date().toISOString(),
            last_modified: new Date().toISOString(),
            created_at: new Date().toISOString(),
            username: data.username,
            password: data.password,
            url: data.url,
            notes: data.notes,
          });

          setShowAddDialog(false);
        }}
      />

      {/* Edit Item Dialog */}
      <EditItemDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleUpdateItem}
        item={selectedItem}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        userId={userId}
        logout={logout}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!itemToDelete) return;
                await supabase
                  .from("vault_items")
                  .delete()
                  .eq("id", itemToDelete)
                  .eq("user_id", userId!);
                removeItem(itemToDelete);
                setShowDeleteDialog(false);
                setItemToDelete(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
