"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
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
import { supabase } from "@/lib/supabase";
import {
  generateSalt,
  deriveKeys,
  estimatePasswordStrength,
} from "@/lib/crypto";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"credentials" | "warning" | "processing">(
    "credentials"
  );
  const [confirmedUnderstand, setConfirmedUnderstand] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const passwordStrength = estimatePasswordStrength(password);
  const strengthColor =
    passwordStrength < 40
      ? "bg-destructive"
      : passwordStrength < 70
      ? "bg-yellow-500"
      : "bg-primary";
  const strengthLabel =
    passwordStrength < 40 ? "Weak" : passwordStrength < 70 ? "Fair" : "Strong";

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }

    if (passwordStrength < 50) {
      setError("Please choose a stronger password");
      return;
    }

    setStep("warning");
  };

  const handleRegister = async () => {
    if (!confirmedUnderstand) {
      setError("Please confirm that you understand by typing 'I UNDERSTAND'");
      return;
    }

    setStep("processing");
    setLoading(true);
    setError(null);

    try {
      // Generate salt and derive keys client-side
      const salt = generateSalt();
      const { verificationKey } = await deriveKeys(password, salt);

      // Create Supabase auth user with the ACTUAL master password
      // This allows login to work with the same password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password, // Use the actual master password, not the verification key
      });

      if (authError) throw authError;

      if (!authData.user) throw new Error("Failed to create user account");

      // Create profile with salt and verifier (upsert to handle if trigger created it)
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: authData.user.id,
        email,
        kdf_salt: salt,
        verifier_hash: verificationKey,
        auto_lock_minutes: 5,
        clear_clipboard_seconds: 30,
        created_at: new Date().toISOString(), // Ensure created_at is set for new rows
      });

      if (profileError) throw profileError;

      // Redirect to login
      router.push("/login?registered=true");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
      setStep("warning");
    } finally {
      setLoading(false);
    }
  };

  if (step === "warning") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Before You Continue</CardTitle>
            <CardDescription>
              Please read this important security information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Zero-Knowledge Architecture
              </h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Sentinel Vault cannot see or recover your passwords</li>
                <li>• There is no password reset option</li>
                <li>
                  • If you lose your master password, your data is PERMANENTLY
                  LOST
                </li>
                <li>
                  • There is no way to recover your account without the master
                  password
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label>
                Type <strong>I UNDERSTAND</strong> to confirm you accept these
                terms
              </Label>
              <Input
                value={confirmationText}
                onChange={(e) => {
                  setConfirmationText(e.target.value);
                  setConfirmedUnderstand(e.target.value === "I UNDERSTAND");
                }}
                placeholder="I UNDERSTAND"
                className="text-center"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("credentials")}
              >
                Go Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleRegister}
                disabled={!confirmedUnderstand || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Your master password will encrypt all your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleContinue} className="space-y-4">
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
                <Label htmlFor="password">Master Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong master password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
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

                {/* Password strength indicator */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((segment) => (
                        <div
                          key={segment}
                          className={`h-1 flex-1 rounded-full ${
                            passwordStrength >= segment * 20
                              ? strengthColor
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {passwordStrength >= 80 ? (
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                      ) : null}
                      Password strength: {strengthLabel}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Master Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your master password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                <p className="font-medium mb-1">Requirements:</p>
                <ul className="space-y-1">
                  <li>• At least 12 characters</li>
                  <li>• Mix of uppercase and lowercase letters</li>
                  <li>• Include numbers and symbols</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                Continue
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                Already have an account?{" "}
              </span>
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
