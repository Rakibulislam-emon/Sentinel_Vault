import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SecurityLoader from "@/components/ui/SecurityLoader";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: "Sentinel Vault | Zero-Knowledge Password Manager",
  description:
    "A secure, zero-knowledge personal password manager built with modern web technologies. Your passwords, encrypted client-side.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SecurityLoader />
        <div className="min-h-screen bg-background">{children}</div>
      </body>
    </html>
  );
}
