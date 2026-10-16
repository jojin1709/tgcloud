# TGCloud Architecture and Technical Specification

## 1. System Overview

TGCloud transforms a personal Telegram account into a high-capacity, high-speed, and secure personal cloud drive.

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

---

## 2. Zero-Backend Design Philosophy

Unlike conventional cloud-storage bridges that require a central relay server (AWS, Supabase, Firebase, or intermediate reverse proxies), TGCloud connects **directly** from the client application on your device to Telegram's MTProto datacenters.

- **Zero intermediate servers**: Your Telegram credentials, session keys, and file contents never touch any third-party infrastructure.
- **Client-Side Indexing**: Directory trees, virtual folders, file stars, and trash records are maintained locally in an encrypted SQLite database on each device.

---

## 3. Telegram Storage Mechanism

Telegram allows users to upload files up to 2 GB (or 4 GB for Telegram Premium users) without storage caps.

TGCloud utilizes a **Dedicated Private Storage Vault**:
1. Upon initial login, TGCloud searches dialogs for a private channel titled `TGCloud Storage Vault`.
2. If none exists, it creates a private broadcast channel with description `[TGCloud:Vault:v1]` accessible only to your account.
3. Fallback to `InputPeer::Self` ("Saved Messages") is supported for accounts without channel creation rights.
4. Each file uploaded creates a native Telegram message containing a `Document` with a unique message ID and document location reference.
5. Deleting a file in TGCloud sends a permanent `deleteMessages` request to Telegram to revoke the remote file.

---

## 4. Chunked Upload & Download Pipeline

```text
Local File (Disk) ──> 512 KB Chunks ──> SHA-256 Hasher ──> MTProto Stream ──> Telegram Vault
Telegram Vault    ──> 512 KB Chunks ──> Local Assembler ──> Checksum Verify ──> Target Disk File
```

- **Chunk Size**: Standard 512 KB parts matching Telegram's optimal MTProto MTU.
- **Speed & ETA Calculation**: Real-time sliding window:
  $$\text{Speed} = \frac{\Delta \text{Bytes}}{\Delta t}$$
  $$\text{ETA} = \frac{\text{Bytes Total} - \text{Bytes Transferred}}{\text{Speed}}$$
- **Pause & Resume**: Supports byte-range offsets, enabling resumption of interrupted transfers without redownloading transferred blocks.

---

## 5. Local SQLite Schema

```sql
-- Local accounts
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    phone TEXT,
    is_premium INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
);

-- Virtual directory hierarchy
CREATE TABLE folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    created_at INTEGER NOT NULL,
    modified_at INTEGER NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- File records with Telegram remote mapping
CREATE TABLE files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_folder_id TEXT,
    telegram_chat_id INTEGER NOT NULL,
    telegram_message_id INTEGER NOT NULL,
    telegram_file_id TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    hash TEXT,
    created_at INTEGER NOT NULL,
    modified_at INTEGER NOT NULL,
    thumbnail_path TEXT,
    status TEXT NOT NULL DEFAULT 'synced',
    is_starred INTEGER NOT NULL DEFAULT 0,
    is_trash INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (parent_folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

-- Persistent transfer queue
CREATE TABLE transfers (
    id TEXT PRIMARY KEY,
    file_id TEXT,
    file_name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    progress REAL NOT NULL DEFAULT 0.0,
    bytes_total INTEGER NOT NULL DEFAULT 0,
    bytes_transferred INTEGER NOT NULL DEFAULT 0,
    speed_bytes_per_sec REAL NOT NULL DEFAULT 0.0,
    eta_seconds INTEGER NOT NULL DEFAULT 0,
    error TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    local_path TEXT
);
```
