# TGCloud Developer Guide

## 1. Prerequisites

### Windows Desktop (Tauri + Rust + React)
- **Node.js**: v18+ (tested with Node v24.11)
- **npm**: v9+ (tested with npm v11.6)
- **Rust**: v1.75+ with `x86_64-pc-windows-msvc` toolchain
- **Visual Studio C++ Build Tools** (including MSVC compiler and Windows SDK)

### Mobile (Android Flutter)
- **Flutter SDK**: 3.x+
- **Android SDK**: API 34+

---

## 2. Desktop Development Workflow

### Install Dependencies
```bash
cd apps/desktop
npm install
```

### Run Frontend in Development Server
```bash
npm run dev
# Starts Vite at http://localhost:1420
```

### Build Frontend
```bash
npm run build
```

### Run Automated Rust Backend Tests
```bash
cd apps/desktop/src-tauri
cargo test
```

### Compile Tauri Desktop Application
```bash
cd apps/desktop
npm run tauri build
```

---

## 3. Mobile Development Workflow

### Fetch Flutter Packages
```bash
cd apps/mobile
flutter pub get
```

### Run Mobile Unit Tests
```bash
flutter test test/unit_test.dart
```

### Build Android APK
```bash
flutter build apk --release
```
