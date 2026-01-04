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
  Mail,
  ArrowLeft,
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
  const [step, setStep] = useState<
    "credentials" | "warning" | "processing" | "success"
  >("credentials");
  const [confirmedUnderstand, setConfirmedUnderstand] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [successEmail, setSuccessEmail] = useState("");

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
    // The button disabled state handles !confirmedUnderstand
    setStep("processing");
    setLoading(true);
    setError(null);

    try {
      // Generate salt and derive keys client-side
      const salt = generateSalt();
      const { verificationKey } = await deriveKeys(password, salt);

      // Create Supabase auth user with the verification key as password
      // Include email redirect for confirmation
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password: verificationKey.slice(0, 60), // Use part of hash as password
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            kdf_salt: salt,
          },
        },
      });

      if (authError) throw authError;

      // Check if user was created successfully
      if (data.user) {
        // When email confirmation is enabled, data.session will be null
        // This is expected behavior - the user needs to confirm their email
        setSuccessEmail(email);
        setStep("success");
      } else {
        throw new Error("Failed to create user");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
      setStep("warning");
    } finally {
      setLoading(false);
    }
  };

  // Success state - Email confirmation required
  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We have sent a confirmation link to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                <span className="font-medium text-foreground">
                  {successEmail}
                </span>
              </p>
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p className="mb-2">
                  <strong>What&apos;s next?</strong>
                </p>
                <ol className="text-left space-y-2 list-decimal list-inside">
                  <li>Click the confirmation link in the email we sent you</li>
                  <li>After confirming, you can log in to your vault</li>
                  <li>
                    During first login, you&apos;ll set up your encryption keys
                  </li>
                </ol>
              </div>
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
                onClick={() => router.push("/login")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Login
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Didn&apos;t receive the email? Check your spam folder or try
              registering again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  const text = e.target.value;
                  setConfirmationText(text);
                  setConfirmedUnderstand(text === "I UNDERSTAND");
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
