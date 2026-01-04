"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Key, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const router = useRouter();

  const features = [
    {
      icon: Lock,
      title: "Zero-Knowledge Encryption",
      description: "Your passwords are encrypted client-side. We never see your master password or unencrypted data.",
    },
    {
      icon: Shield,
      title: "Military-Grade Security",
      description: "AES-256-GCM encryption with PBKDF2 key derivation using 600,000 iterations.",
    },
    {
      icon: Key,
      title: "Complete Control",
      description: "Your data stays on your device until you choose to sync. No account recovery means true privacy.",
    },
  ];

  const benefits = [
    "Client-side encryption - server never sees plaintext",
    "PBKDF2 key derivation with 600,000 iterations",
    "AES-256-GCM authenticated encryption",
    "Auto-lock after inactivity",
    "Privacy blur when window loses focus",
    "Secure clipboard with auto-clear",
    "Password generator with crypto randomness",
    "Category organization",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Sentinel Vault</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/login")}>
              Sign In
            </Button>
            <Button onClick={() => router.push("/register")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            The Password Manager That
            <span className="text-primary"> Knows Nothing</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sentinel Vault implements true zero-knowledge encryption. 
            All cryptographic operations happen in your browser. 
            Your passwords are yours alone.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" onClick={() => router.push("/register")}>
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push("/login")}>
              Already have an account?
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Security By Design
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Security Features
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Warning Section */}
      <section className="py-16 px-4 bg-destructive/10">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold mb-4">
            Important Security Note
          </h2>
          <p className="text-muted-foreground mb-6">
            Because Sentinel Vault uses zero-knowledge encryption, we cannot 
            reset your password or recover your data if you lose your master password. 
            There is no "forgot password" feature - by design.
          </p>
          <p className="text-sm text-muted-foreground">
            Store your master password securely. Consider using a separate password manager 
            or physical secure storage for your Sentinel Vault master password.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>Sentinel Vault - Zero-Knowledge Password Manager</p>
          <p className="mt-2">
            Built with Next.js, Supabase, and Web Crypto API
          </p>
        </div>
      </footer>
    </div>
  );
}
