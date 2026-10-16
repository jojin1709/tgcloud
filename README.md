# TGCloud — Telegram-Backed Cloud Storage Application

<div align="center">
  <img src="apps/desktop/public/logo.svg" width="96" height="96" alt="TGCloud Logo" />
  <h3>Personal Cloud Storage with your own Telegram Account as the Backend</h3>
  <p>Free, unlimited-quota storage architecture connecting directly to Telegram MTProto</p>
</div>

---

## 🚀 Overview

**TGCloud** is a personal cloud-storage and file-management application that turns your personal Telegram account into an unlimited, high-speed, direct cloud drive.

Instead of paying recurring subscription fees for conventional cloud drives or relying on third-party cloud servers, TGCloud uses official Telegram MTProto APIs to store, index, stream, and manage your files directly.

---

## 🌟 Key Features

- **Direct Telegram MTProto Communication**: Zero intermediate backend servers. Your files stream directly to and from Telegram datacenters.
- **Full File Manager Experience**: Virtual folders, subfolders, rename, move, star, trash, and permanent deletion without exposing Telegram's raw chat interface.
- **High-Performance Transfer Engine**: Real chunked transfers (512 KB parts), live speed calculations (MB/s), accurate ETAs, pause, resume, and retry support.
- **Search**: Local SQLite database queries for instantaneous search by filename, extension, and category without unnecessary network roundtrips.
- **Previews**: Instant preview for images, video information, audio playback, and metadata viewer.
- **Cross-Platform**:
  - **Windows Desktop**: High-performance Tauri v2 + Rust + React + TypeScript + Tailwind CSS.
  - **Android Mobile**: Flutter + Dart + SQLite with Android Share Sheet integration (*Gallery -> Share -> TGCloud*).
- **Security & Privacy First**:
  - No Telegram passwords saved on disk.
  - OS-restricted user session files.
  - SQLite protection with 100% parameterized queries.
  - No tracking, telemetry, or third-party analytics.

---

## 🏛 Architecture

```text
                           TELEGRAM
                              │
                           MTProto
                              │
               ┌──────────────┴──────────────┐
               │                             │
        WINDOWS DESKTOP                   ANDROID
               │                             │
          Tauri + Rust                    Flutter
               │                             │
       React + TypeScript                  Dart
               │                             │
            SQLite                        SQLite
```

### Technology Matrix

| Layer | Windows Desktop | Android Mobile |
| :--- | :--- | :--- |
| **Framework** | Tauri v2 | Flutter 3.x |
| **Core Logic** | Rust 2021 | Dart 3.x |
| **UI System** | React 18 + Tailwind CSS + Lucide | Flutter Material 3 |
| **Database** | SQLite WAL (`rusqlite`) | SQLite (`sqflite`) |
| **Telegram Protocol** | Native MTProto (`grammers-client`) | MTProto Direct Client |

---

## 📁 Monorepo Structure

```text
TGCloud/
│
├── apps/
│   ├── desktop/                 # Windows Tauri Desktop Application
│   │   ├── src/                 # React 18 + TypeScript + Tailwind CSS
│   │   ├── src-tauri/           # Rust Tauri Backend (MTProto & SQLite)
│   │   └── package.json
│   │
│   └── mobile/                  # Android Flutter Mobile Application
│       ├── lib/                 # Flutter Dart logic, models, & screens
│       ├── android/             # Android native configuration & Share Sheet
│       ├── test/                # Flutter unit tests
│       └── pubspec.yaml
│
├── packages/
│   ├── shared/                  # Common utilities
│   └── types/                   # Shared TypeScript definitions
│
├── docs/
│   ├── architecture.md          # Technical architecture & design decisions
│   ├── telegram-setup.md        # Telegram API credential setup guide
│   └── development.md           # Developer workflow & commands
│
├── .env.example                 # Environment configuration template
├── SECURITY.md                  # Security model & threat protection
├── PRIVACY.md                   # Zero-telemetry & privacy policy
└── README.md
```

---

## ⚙️ Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Obtain your official `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` from [https://my.telegram.org](https://my.telegram.org) (see [docs/telegram-setup.md](docs/telegram-setup.md)).

3. Configure your keys:
   ```env
   TELEGRAM_API_ID=12345678
   TELEGRAM_API_HASH=abcdef0123456789abcdef0123456789
   ```

---

## 🛠 Building and Running

### 1. Windows Desktop

#### Prerequisites:
- Node.js v18+ and npm
- Rust (`rustc 1.75+`) with `x86_64-pc-windows-msvc`
- Visual Studio C++ Build Tools

#### Run Desktop Frontend:
```bash
cd apps/desktop
npm install
npm run dev
```

#### Run Rust Backend Unit Tests:
```bash
cd apps/desktop/src-tauri
cargo test
```

#### Build Desktop Production Bundle:
```bash
cd apps/desktop
npm run build
```

---

### 2. Android Mobile

#### Prerequisites:
- Flutter SDK 3.x+
- Android SDK

#### Fetch dependencies:
```bash
cd apps/mobile
flutter pub get
```

#### Run Mobile Tests:
```bash
flutter test test/unit_test.dart
```

#### Build Android APK:
```bash
flutter build apk --release
```

---

## 🛡 Security & Privacy

TGCloud is engineered according to Zero-Knowledge and direct-client principles:
- **No intermediary backend**: TGCloud is completely serverless from our side. All requests communicate directly between your machine and Telegram's servers.
- **Secure Sessions**: Authentication sessions are stored strictly in the OS-protected user directory (`%APPDATA%\TGCloud` on Windows).
- **No Password Storage**: Cloud Two-Step Verification passwords are used strictly in-memory during the ephemeral authentication handshake and never written to disk.
- See [SECURITY.md](SECURITY.md) and [PRIVACY.md](PRIVACY.md) for complete details.

---

## 📄 License

MIT License. Designed and built with pride for Telegram personal cloud storage users.
