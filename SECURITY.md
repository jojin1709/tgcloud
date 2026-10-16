# TGCloud Security Policy and Architecture

## 1. Security Core Principles

TGCloud is engineered with a strict **Zero-Knowledge & Direct-Client-to-Telegram** architecture.

- **No Intermediate Central Server**: There is no TGCloud proxy, relay, or cloud backend. All traffic flows directly from the user's client app to Telegram official MTProto endpoints via TLS-encrypted connections.
- **Direct MTProto Protocol**: Uses official Telegram MTProto v2 client protocol implementations (e.g. `grammers-client` in Rust with official Telegram cryptographic layers).
- **No Password Storage**: TGCloud **never** stores the user's Two-Step Verification (2FA) cloud password. Passwords are sent ephemerally to Telegram during SRP authentication and immediately zeroized in memory.
- **No Hardcoded Secrets**: Developers and users supply their own official `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` via protected environment variables or secure local encrypted application settings.

---

## 2. Session & Credential Storage

1. **Session Files**:
   - Telegram MTProto sessions are stored exclusively in the OS-protected user directory (`%APPDATA%\TGCloud` on Windows, secure app sandboxes on Android).
   - Session keys are protected from external processes using OS file permissions (`0600` / Windows ACLs restricted to the current user token).
   - Session tokens can be revoked at any time directly through TGCloud or through official Telegram apps under *Settings -> Devices*.

2. **SQLite Database Security**:
   - The SQLite database indexes metadata (file names, folder structures, Telegram message IDs, MIME types, and transfer logs).
   - Parameterized queries (`rusqlite` prepared statements) are strictly enforced across 100% of database operations to eliminate SQL injection.

---

## 3. File System & Transfer Protection

1. **Path Traversal Protection**:
   - All incoming file names and download target paths are sanitized using strict path canonicalization.
   - Directory traversal attacks (`../`, `..\`, null bytes, control characters, and reserved Windows device names like `CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9`) are rejected and sanitized.

2. **Temporary File Lifecycle**:
   - Chunked uploads and preview caches are stored in an isolated scratch directory.
   - Ephemeral preview files are scheduled for automatic purge on app shutdown or when exceeding configurable cache limits.

3. **No Shell Invocations**:
   - File opens and shell actions utilize explicit OS APIs (e.g., `open::that` or Tauri's strict opener) without invoking arbitrary shell strings (`cmd.exe /c` or PowerShell eval).

---

## 4. Client-Side Encryption Extension Point

TGCloud is architected with a modular storage stream layer (`StorageEngine`). While Telegram's MTProto provides transit encryption and secure private channel storage, an optional AES-256-GCM client-side encryption wrapper can be toggled per vault:
- Files are encrypted client-side using a locally derived key before chunked upload.
- On download, chunks are decrypted in-memory or streamed to disk before checksum validation.

---

## 5. Reporting Security Vulnerabilities

If you identify a security issue in TGCloud:
- Please report it responsibly.
- Do not publicly disclose vulnerabilities before a patch is released.
