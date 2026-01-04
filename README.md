# 🔐 Sentinel Vault

<div align="center">

**A secure, zero-knowledge personal password manager built for privacy-conscious users.**

_All cryptographic operations occur client-side — the server never sees your master password or unencrypted data._

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3.0-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

[Features](#-features) • [Security](#-security-architecture) • [Installation](#-getting-started) • [Documentation](#-documentation) • [Contributing](#-contributing)

---

</div>

## 🎯 What is Sentinel Vault?

Sentinel Vault is a **zero-knowledge password manager** that puts your privacy and security first. Unlike traditional password managers that store your credentials on their servers with the ability to access them, Sentinel Vault implements a "trust nothing" architecture where only you hold the keys to your data.

The server functions exclusively as encrypted storage, never receiving access to your master password, encryption keys, or plaintext credentials. All cryptographic operations occur entirely in your browser, establishing a security model that remains robust even in the event of complete server compromise.

## ✨ Features

### Core Functionality

- **🔒 Zero-Knowledge Encryption** — Your passwords are encrypted client-side before they ever leave your device
- **🏛️ Military-Grade Security** — AES-256-GCM encryption with PBKDF2 key derivation (600,000 iterations)
- **🔑 Twin Keys Architecture** — Separate encryption and verification keys for defense in depth
- **📁 Secure Password Storage** — Store credentials with titles, usernames, URLs, and notes
- **🔄 Password Generator** — Generate cryptographically secure random passwords
- **📂 Category Organization** — Organize passwords with custom categories
- **⭐ Favorites** — Quick access to frequently used passwords

### Security Features

- **⏰ Auto-Lock** — Automatically locks after configurable inactivity period
- **👁️ Privacy Blur** — Blurs vault content when window loses focus (prevents shoulder surfing)
- **📋 Secure Clipboard** — Automatically clears copied passwords from clipboard
- **🛡️ No Password Recovery** — True zero-knowledge means no backdoors possible

### Technical Features

- **🌐 Open Source** — Transparent code that anyone can audit
- **⚡ Fast & Responsive** — Built with Next.js 15 and React 18
- **📱 Responsive Design** — Works seamlessly on desktop and mobile
- **🎨 Modern UI** — Beautiful interface built with Tailwind CSS and shadcn/ui
- **🔧 Developer Friendly** — TypeScript throughout for type safety

## 🏛️ Security Architecture

Sentinel Vault implements multiple layers of security to protect your credentials:

### Zero-Knowledge Guarantee

| Data Stored on Server | Data NEVER Stored       |
| --------------------- | ----------------------- |
| Encrypted ciphertext  | Master password         |
| Public KDF salt       | Encryption key          |
| Verifier hash         | Decrypted vault items   |
| User email            | Any plaintext passwords |

### Cryptographic Specifications

- **Key Derivation**: PBKDF2-HMAC-SHA256 with 600,000 iterations
- **Encryption**: AES-256-GCM with unique 12-byte IV per item
- **Key Splitting**: 512-bit derived key split into 256-bit encryption and verification keys
- **Authentication**: SHA-256 hash of verification key

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW                         │
├─────────────────────────────────────────────────────────────┤
│  1. User enters master password                             │
│  2. Client generates 16-byte random salt                    │
│  3. PBKDF2 derives 512-bit key (600,000 iterations)         │
│  4. Key splits into:                                        │
│     • Encryption Key (256-bit) → Encrypts vault items       │
│     • Verification Key (256-bit) → Hash for auth            │
│  5. Auth account created with email                         │
│  6. Salt and verifier hash stored in profiles table         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      LOGIN FLOW                             │
├─────────────────────────────────────────────────────────────┤
│  1. User enters master password                             │
│  2. Client fetches salt from profiles table                 │
│  3. PBKDF2 derives encryption key (same process)            │
│  4. Client decrypts vault items from database               │
│  5. Decrypted passwords available in memory only            │
└─────────────────────────────────────────────────────────────┘
```

### Verification You Can Perform

1. **Check the Database**: Examine Supabase vault_items table — only encrypted ciphertext visible
2. **Monitor Network Traffic**: Observe that only ciphertext is transmitted, never plaintext
3. **Review Source Code**: Audit the cryptographic implementation in `lib/crypto.ts`
4. **Test State Management**: Verify encryption keys exist only in memory, not LocalStorage

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn**
- **Supabase** account (free tier works great)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/sentinel-vault.git
cd sentinel-vault
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note**: Get these values from Supabase Dashboard → Project Settings → API

4. **Set up the database**

Run the SQL schema in Supabase Dashboard → SQL Editor:

```bash
# Copy and paste contents of supabase-schema.sql
# Click "Run" to execute
```

5. **Start the development server**

```bash
npm run dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
sentinel-vault/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page
│   ├── login/                    # Authentication
│   ├── register/                 # User registration
│   ├── vault/                    # Main vault dashboard
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   └── ui/                       # Reusable UI components
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── toast.tsx
├── lib/                          # Core libraries
│   ├── crypto.ts                 # Cryptographic operations
│   ├── supabase.ts               # Supabase client & helpers
│   └── utils.ts                  # Utility functions
├── store/                        # State management
│   └── vaultStore.ts             # Zustand store
├── tests/                        # Playwright tests
│   ├── critical.spec.ts
│   ├── landing.spec.ts
│   ├── auth.spec.ts
│   ├── security.spec.ts
│   └── crypto.spec.ts
├── public/                       # Static assets
├── supabase-schema.sql           # Database schema
├── playwright.config.ts          # Test configuration
├── tailwind.config.ts            # Tailwind configuration
├── next.config.ts                # Next.js configuration
└── package.json
```

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run tests
npm test

# View test report
npm run test:report

# Interactive test UI
npm run test:ui
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test tests/critical.spec.ts

# Run with UI
npm run test:ui
```

## 📚 Documentation

- **[WHY-SENTINEL-VAULT.md](./WHY-SENTINEL-VAULT.md)** — Comprehensive guide on why Sentinel Vault is secure and how to explain it to others


## 🔒 Security Considerations

### What You Need to Know

1. **No Password Recovery**: Due to zero-knowledge architecture, lost master passwords cannot be recovered. Store your master password securely.

2. **Session Management**: Sessions are managed by Supabase Auth. The encryption key lives only in memory (Zustand store) and is never persisted.

3. **XSS Protection**: React automatically escapes content. No user input is rendered as HTML, preventing XSS attacks.

4. **Network Security**: All communications use HTTPS. Supabase provides built-in CORS protection.

### Reporting Vulnerabilities

If you discover a security vulnerability in Sentinel Vault, please email security@example.com instead of opening a public issue. Do not disclose vulnerabilities publicly until we have had a chance to address them.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

### Ways to Contribute

- 🐛 **Report Bugs** — Help us identify and fix issues
- 💡 **Suggest Features** — Share ideas for improvements
- 📝 **Improve Documentation** — Make our docs clearer
- 🔧 **Submit PRs** — Directly contribute code
- 🌐 **Translate** — Help us reach more users

### Getting Help

- 📖 **Documentation** — Check the docs folder
- 💬 **Discussions** — Start a discussion on GitHub
- 🐛 **Issues** — Search existing issues or create new ones

## 📈 Roadmap

### Planned Features

- [ ] Browser extension for auto-fill
- [ ] Import/export functionality (encrypted)
- [ ] Password strength analysis
- [ ] Two-factor authentication
- [ ] Secure password sharing (zero-knowledge)
- [ ] Mobile apps (iOS/Android)
- [ ] Self-hosted deployment option

### Release History

- **v1.0.0** (January 2026) — Initial release
  - Core password management
  - Zero-knowledge architecture
  - Basic security features

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for privacy-conscious users everywhere**

🔐 Sentinel Vault — Your passwords, your keys, your data 🔐

</div>
# sentinel-vault
# Sentinel_Vault
