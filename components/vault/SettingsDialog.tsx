"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  logout: () => void;
}

export default function SettingsDialog({
  open,
  onOpenChange,
  userId,
  logout,
}: SettingsDialogProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (confirmationText !== "DELETE") {
      setError("Please type DELETE to confirm.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the RPC function to delete the user
      const { error: rpcError } = await supabase.rpc("delete_user_account");

      if (rpcError) throw rpcError;

      // Force sign out client-side
      try {
        await supabase.auth.signOut();
      } catch (err) {
        // Ignore error if user is already deleted
        console.log("Expected error during signout after delete:", err);
      }
      logout(); // Clear local store
      router.push("/login");
    } catch (err: unknown) {
      console.error("Delete account error:", err);
      setError("Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Danger Zone
            </h3>
            <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h4 className="font-semibold text-destructive">
                    Delete Account
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Permanently delete your account and all{" "}
                    <strong>encrypted data</strong>. This action cannot be
                    undone.
                  </p>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-4 pt-4 border-t border-destructive/20">
                  <div className="space-y-2">
                    <Label className="text-destructive font-medium">
                      Type DELETE to confirm
                    </Label>
                    <Input
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      placeholder="DELETE"
                      className="border-destructive/30 focus-visible:ring-destructive"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive font-medium">
                      {error}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setConfirmationText("");
                        setError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={confirmationText !== "DELETE" || loading}
                      onClick={handleDeleteAccount}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Confirm Delete"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
