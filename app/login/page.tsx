"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Loader2, Eye, EyeOff } from "lucide-react";
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
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/vault");
      }
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log("Starting login process...");

    try {
      // 1. Get the user's salt
      console.log("Fetching user salt for:", email);
      const { data: salt, error: saltError } = await supabase.rpc(
        "get_user_salt",
        {
          email_input: email,
        }
      );

      if (saltError) {
        console.error("Error fetching salt:", saltError);
        throw new Error("Invalid login credentials");
      }

      if (!salt) {
        console.error("No salt found for user");
        throw new Error("Invalid login credentials");
      }

      console.log("Salt fetched successfully. Deriving keys...");

      // 2. Derive the key using the password and salt
      // Ensure we are importing the module correctly
      const cryptoModule = await import("@/lib/crypto");
      console.log("Crypto module loaded");

      const { verificationKey } = await cryptoModule.deriveKeys(password, salt);
      console.log("Key derived successfully");

      // 3. Sign in using the verification key
      console.log("Attempting sign in with derived key...");
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: verificationKey.slice(0, 60),
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        throw signInError;
      }

      console.log("Sign in successful, redirecting to vault...");
      router.push("/vault");
    } catch (err: unknown) {
      console.error("Login exception:", err);
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      // Don't expose specific RLS/RPC errors to user
      if (
        errorMessage.includes("function") ||
        errorMessage.includes("RPC") ||
        errorMessage.includes("metadata")
      ) {
        setError(
          "System error: Database setup incomplete. Please contact support."
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Shield className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold">Sentinel Vault</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Enter your credentials to unlock your vault
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                Do not have an account?{" "}
              </span>
              <Link href="/register" className="text-primary hover:underline">
                Create one
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-card border border-border rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Note:</strong> This login authenticates your account. After
            signing in, you will need to enter your master password to decrypt
            your vault data.
          </p>
        </div>
      </div>
    </div>
  );
}
