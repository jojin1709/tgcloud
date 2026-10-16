# TGCloud Developer Guide

This guide is intended for developers contributing to or compiling TGCloud from source.
End users should simply download the pre-compiled releases from [GitHub Releases](https://github.com/jojin1709/tgcloud/releases/latest).

---

## 1. Prerequisites

### Windows Desktop (Tauri + Rust + React)
- **Node.js**: v18+ (tested with Node v24.11)
- **npm**: v9+ (tested with npm v11.6)
- **Rust**: v1.75+ with `x86_64-pc-windows-msvc` toolchain
- **Visual Studio C++ Build Tools** (including MSVC compiler and Windows SDK)

### Mobile (Android Flutter)
- **Flutter SDK**: 3.x+
- **Android SDK**: API 34+
- **Java**: JDK 17+

---

## 2. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure your Telegram API credentials obtained from [my.telegram.org](https://my.telegram.org):
   ```env
   TELEGRAM_API_ID=your_api_id_here
   TELEGRAM_API_HASH=your_api_hash_here
   ```

*(Note: `.env` is protected by `.gitignore` across all subdirectories and will never be committed to Git).*

---

## 3. Desktop Development Workflow

### Install Frontend Dependencies
```bash
cd apps/desktop
npm install
```

### Run Frontend in Development Server
```bash
npm run dev
# Starts Vite dev server at http://localhost:1420
```

### Build Production Web Assets
```bash
npm run build
```

### Run Automated Rust Backend Unit Tests
```bash
cd apps/desktop/src-tauri
cargo test
```

### Compile Release Windows Executable
```bash
cd apps/desktop/src-tauri
cargo build --release
# Generates apps/desktop/src-tauri/target/release/tgcloud-desktop.exe
```

---

## 4. Mobile Development Workflow

### Fetch Flutter Dependencies
```bash
cd apps/mobile
flutter pub get
```

### Run Mobile Unit Tests
```bash
flutter test test/unit_test.dart
```

### Build Android Release APK
```bash
flutter build apk --release
# Generates apps/mobile/build/app/outputs/flutter-apk/app-release.apk
```
