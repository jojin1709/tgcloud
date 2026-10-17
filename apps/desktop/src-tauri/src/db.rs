use std::path::Path;
use std::sync::{Arc, Mutex};
use rusqlite::{params, Connection};
use uuid::Uuid;
use chrono::Utc;
use crate::error::AppError;
use crate::models::{SearchQuery, StorageStats, TGFile, TGFolder, TGTransfer, TGUser};

#[derive(Clone)]
pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn new<P: AsRef<Path>>(db_path: P) -> Result<Self, AppError> {
        let conn = Connection::open(db_path)?;
        conn.execute_batch("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;")?;

        let db = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        db.create_tables()?;
        Ok(db)
    }

    pub fn in_memory() -> Result<Self, AppError> {
        let conn = Connection::open_in_memory()?;
        let db = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        db.create_tables()?;
        Ok(db)
    }

    fn create_tables(&self) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();

        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT,
                first_name TEXT NOT NULL,
                last_name TEXT,
                phone TEXT,
                is_premium INTEGER NOT NULL DEFAULT 0,
                updated_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parent_id TEXT,
                created_at INTEGER NOT NULL,
                modified_at INTEGER NOT NULL,
                FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS files (
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

            CREATE TABLE IF NOT EXISTS transfers (
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

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_files_folder ON files(parent_folder_id);
            CREATE INDEX IF NOT EXISTS idx_files_starred ON files(is_starred);
            CREATE INDEX IF NOT EXISTS idx_files_trash ON files(is_trash);
            CREATE INDEX IF NOT EXISTS idx_files_name ON files(name);
            CREATE INDEX IF NOT EXISTS idx_files_hash ON files(hash);
            CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
            CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
            "#
        )?;

        Ok(())
    }

    // User operations
    pub fn save_user(&self, user: &TGUser) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().timestamp_millis();
        conn.execute(
            r#"
            INSERT OR REPLACE INTO users (id, username, first_name, last_name, phone, is_premium, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            "#,
            params![
                user.id,
                user.username,
                user.first_name,
                user.last_name,
                user.phone,
                if user.is_premium { 1 } else { 0 },
                now
            ],
        )?;
        Ok(())
    }

    pub fn get_user(&self) -> Result<Option<TGUser>, AppError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, username, first_name, last_name, phone, is_premium FROM users ORDER BY updated_at DESC LIMIT 1"
        )?;

        let mut rows = stmt.query([])?;
        if let Some(row) = rows.next()? {
            let is_premium_int: i32 = row.get(5)?;
            Ok(Some(TGUser {
                id: row.get(0)?,
                username: row.get(1)?,
                first_name: row.get(2)?,
                last_name: row.get(3)?,
                phone: row.get(4)?,
                is_premium: is_premium_int == 1,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn clear_user(&self) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM users", [])?;
        Ok(())
    }

    // Folder operations
    pub fn create_folder(&self, name: &str, parent_id: Option<String>) -> Result<TGFolder, AppError> {
        let trimmed_name = name.trim();
        if trimmed_name.is_empty() {
            return Err(AppError::invalid_input("Folder name cannot be empty"));
        }

        let conn = self.conn.lock().unwrap();
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().timestamp_millis();

        conn.execute(
            r#"
            INSERT INTO folders (id, name, parent_id, created_at, modified_at)
            VALUES (?1, ?2, ?3, ?4, ?5)
            "#,
            params![id, trimmed_name, parent_id, now, now],
        )?;

        Ok(TGFolder {
            id,
            name: trimmed_name.to_string(),
            parent_id,
            created_at: now,
            modified_at: now,
            file_count: 0,
            total_size: 0,
        })
    }

    pub fn list_folders(&self, parent_id: Option<String>) -> Result<Vec<TGFolder>, AppError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            r#"
            SELECT 
                f.id, f.name, f.parent_id, f.created_at, f.modified_at,
                (SELECT COUNT(*) FROM files WHERE parent_folder_id = f.id AND is_trash = 0) as file_count,
                (SELECT COALESCE(SUM(size), 0) FROM files WHERE parent_folder_id = f.id AND is_trash = 0) as total_size
            FROM folders f
            WHERE (?1 IS NULL AND f.parent_id IS NULL) OR f.parent_id = ?1
            ORDER BY f.name COLLATE NOCASE ASC
            "#
        )?;

        let rows = stmt.query_map(params![parent_id], |row| {
            Ok(TGFolder {
                id: row.get(0)?,
                name: row.get(1)?,
                parent_id: row.get(2)?,
                created_at: row.get(3)?,
                modified_at: row.get(4)?,
                file_count: row.get(5)?,
                total_size: row.get(6)?,
            })
        })?;

        let mut folders = Vec::new();
        for folder in rows {
            folders.push(folder?);
        }
        Ok(folders)
    }

    pub fn rename_folder(&self, id: &str, new_name: &str) -> Result<(), AppError> {
        let trimmed = new_name.trim();
        if trimmed.is_empty() {
            return Err(AppError::invalid_input("Folder name cannot be empty"));
        }
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().timestamp_millis();
        let updated = conn.execute(
            "UPDATE folders SET name = ?1, modified_at = ?2 WHERE id = ?3",
            params![trimmed, now, id],
        )?;
        if updated == 0 {
            return Err(AppError::not_found("Folder not found"));
        }
        Ok(())
    }

    pub fn move_folder(&self, id: &str, new_parent_id: Option<String>) -> Result<(), AppError> {
        if let Some(ref p_id) = new_parent_id {
            if p_id == id {
                return Err(AppError::invalid_input("Cannot move folder into itself"));
            }
        }
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().timestamp_millis();
        let updated = conn.execute(
            "UPDATE folders SET parent_id = ?1, modified_at = ?2 WHERE id = ?3",
            params![new_parent_id, now, id],
        )?;
        if updated == 0 {
            return Err(AppError::not_found("Folder not found"));
        }
        Ok(())
    }

    pub fn delete_folder(&self, id: &str) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM folders WHERE id = ?1", params![id])?;
        Ok(())
    }

    // File operations
    pub fn insert_file(&self, file: &TGFile) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            r#"
            INSERT OR REPLACE INTO files (
                id, name, parent_folder_id, telegram_chat_id, telegram_message_id,
                telegram_file_id, mime_type, size, hash, created_at, modified_at,
                thumbnail_path, status, is_starred, is_trash
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
            "#,
            params![
                file.id,
                file.name,
                file.parent_folder_id,
                file.telegram_chat_id,
                file.telegram_message_id,
                file.telegram_file_id,
                file.mime_type,
                file.size,
                file.hash,
                file.created_at,
                file.modified_at,
                file.thumbnail_path,
                file.status,
                if file.is_starred { 1 } else { 0 },
                if file.is_trash { 1 } else { 0 },
            ],
        )?;
        Ok(())
    }

    pub fn list_files(
        &self,
        folder_id: Option<String>,
        starred_only: bool,
        trash_only: bool,
    ) -> Result<Vec<TGFile>, AppError> {
        let conn = self.conn.lock().unwrap();

        let query = if trash_only {
            r#"
            SELECT id, name, parent_folder_id, telegram_chat_id, telegram_message_id,
                   telegram_file_id, mime_type, size, hash, created_at, modified_at,
                   thumbnail_path, status, is_starred, is_trash
            FROM files
            WHERE is_trash = 1
            ORDER BY modified_at DESC
            "#
        } else if starred_only {
            r#"
            SELECT id, name, parent_folder_id, telegram_chat_id, telegram_message_id,
                   telegram_file_id, mime_type, size, hash, created_at, modified_at,
                   thumbnail_path, status, is_starred, is_trash
            FROM files
            WHERE is_starred = 1 AND is_trash = 0
            ORDER BY modified_at DESC
            "#
        } else {
            r#"
            SELECT id, name, parent_folder_id, telegram_chat_id, telegram_message_id,
                   telegram_file_id, mime_type, size, hash, created_at, modified_at,
                   thumbnail_path, status, is_starred, is_trash
            FROM files
            WHERE is_trash = 0 AND ((?1 IS NULL AND parent_folder_id IS NULL) OR parent_folder_id = ?1)
            ORDER BY modified_at DESC
            "#
        };
        let mut stmt = conn.prepare(query)?;
        let mut files = Vec::new();
        if trash_only || starred_only {
            let mut rows = stmt.query([])?;
            while let Some(row) = rows.next()? {
                files.push(Self::row_to_file(row)?);
            }
        } else {
            let mut rows = stmt.query(params![folder_id])?;
            while let Some(row) = rows.next()? {
                files.push(Self::row_to_file(row)?);
            }
        }
        Ok(files)
    }

    pub fn get_file(&self, id: &str) -> Result<Option<TGFile>, AppError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            r#"
            SELECT id, name, parent_folder_id, telegram_chat_id, telegram_message_id,
                   telegram_file_id, mime_type, size, hash, created_at, modified_at,
                   thumbnail_path, status, is_starred, is_trash
            FROM files WHERE id = ?1
            "#
        )?;
        let mut rows = stmt.query_map(params![id], |row| Self::row_to_file(row))?;
        if let Some(res) = rows.next() {
            Ok(Some(res?))
        } else {
            Ok(None)
        }
    }

    pub fn get_file_by_tg(&self, chat_id: i64, message_id: i32) -> Result<Option<TGFile>, AppError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            r#"
            SELECT id, name, parent_folder_id, telegram_chat_id, telegram_message_id,
                   telegram_file_id, mime_type, size, hash, created_at, modified_at,
                   thumbnail_path, status, is_starred, is_trash
            FROM files WHERE telegram_chat_id = ?1 AND telegram_message_id = ?2
            "#
        )?;
        let mut rows = stmt.query_map(params![chat_id, message_id], |row| Self::row_to_file(row))?;
        if let Some(res) = rows.next() {
            Ok(Some(res?))
        } else {
            Ok(None)
        }
    }

    pub fn has_file_by_message_id(&self, message_id: i32) -> Result<bool, AppError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT 1 FROM files WHERE telegram_message_id = ?1 LIMIT 1")?;
        let exists = stmt.exists(params![message_id])?;
        Ok(exists)
    }

    pub fn find_file_by_hash(&self, hash: &str) -> Result<Option<TGFile>, AppError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            r#"
            SELECT id, name, parent_folder_id, telegram_chat_id, telegram_message_id,
                   telegram_file_id, mime_type, size, hash, created_at, modified_at,
                   thumbnail_path, status, is_starred, is_trash
            FROM files
            WHERE hash = ?1 AND is_trash = 0 AND telegram_message_id > 0
            LIMIT 1
            "#
        )?;
        let mut rows = stmt.query_map(params![hash], |row| Self::row_to_file(row))?;
        if let Some(res) = rows.next() {
            Ok(Some(res?))
        } else {
            Ok(None)
        }
    }

    pub fn rename_file(&self, id: &str, new_name: &str) -> Result<(), AppError> {
        let trimmed = new_name.trim();
        if trimmed.is_empty() {
            return Err(AppError::invalid_input("File name cannot be empty"));
        }
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().timestamp_millis();
        let updated = conn.execute(
            "UPDATE files SET name = ?1, modified_at = ?2 WHERE id = ?3",
            params![trimmed, now, id],
        )?;
        if updated == 0 {
            return Err(AppError::not_found("File not found"));
        }
        Ok(())
    }

    pub fn move_file(&self, id: &str, new_parent_folder_id: Option<String>) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().timestamp_millis();
        let updated = conn.execute(
            "UPDATE files SET parent_folder_id = ?1, modified_at = ?2 WHERE id = ?3",
            params![new_parent_folder_id, now, id],
        )?;
        if updated == 0 {
            return Err(AppError::not_found("File not found"));
        }
        Ok(())
    }

    pub fn toggle_star_file(&self, id: &str) -> Result<bool, AppError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT is_starred FROM files WHERE id = ?1")?;
        let current_starred: i32 = stmt.query_row(params![id], |row| row.get(0))?;
        let new_starred = if current_starred == 1 { 0 } else { 1 };
        conn.execute("UPDATE files SET is_starred = ?1 WHERE id = ?2", params![new_starred, id])?;
        Ok(new_starred == 1)
    }

    pub fn set_file_trash(&self, id: &str, is_trash: bool) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();
        let updated = conn.execute(
            "UPDATE files SET is_trash = ?1 WHERE id = ?2",
            params![if is_trash { 1 } else { 0 }, id],
        )?;
        if updated == 0 {
            return Err(AppError::not_found("File not found"));
        }
        Ok(())
    }

    pub fn delete_file_permanent(&self, id: &str) -> Result<TGFile, AppError> {
        let file = self.get_file(id)?.ok_or_else(|| AppError::not_found("File not found"))?;
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM files WHERE id = ?1", params![id])?;
        Ok(file)
    }

    pub fn search_files(&self, query: &SearchQuery) -> Result<Vec<TGFile>, AppError> {
        let conn = self.conn.lock().unwrap();
        let term = format!("%{}%", query.term.trim());

        let category_clause = match query.mime_type_category.as_deref() {
            Some("images") => "AND (mime_type LIKE 'image/%')",
            Some("videos") => "AND (mime_type LIKE 'video/%')",
            Some("audio") => "AND (mime_type LIKE 'audio/%')",
            Some("documents") => "AND (mime_type LIKE '%pdf%' OR mime_type LIKE '%document%' OR mime_type LIKE '%text%' OR mime_type LIKE '%sheet%')",
            Some("archives") => "AND (mime_type LIKE '%zip%' OR mime_type LIKE '%tar%' OR mime_type LIKE '%rar%' OR mime_type LIKE '%7z%')",
            _ => "",
        };

        let sort_order = match (query.sort_by.as_deref(), query.sort_order.as_deref()) {
            (Some("name"), Some("desc")) => "ORDER BY name COLLATE NOCASE DESC",
            (Some("name"), _) => "ORDER BY name COLLATE NOCASE ASC",
            (Some("size"), Some("desc")) => "ORDER BY size DESC",
            (Some("size"), _) => "ORDER BY size ASC",
            (_, Some("asc")) => "ORDER BY modified_at ASC",
            _ => "ORDER BY modified_at DESC",
        };

        let sql = format!(
            r#"
            SELECT id, name, parent_folder_id, telegram_chat_id, telegram_message_id,
                   telegram_file_id, mime_type, size, hash, created_at, modified_at,
                   thumbnail_path, status, is_starred, is_trash
            FROM files
            WHERE is_trash = 0 AND name LIKE ?1 {} {}
            "#,
            category_clause, sort_order
        );

        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map(params![term], |row| Self::row_to_file(row))?;

        let mut files = Vec::new();
        for f in rows {
            files.push(f?);
        }
        Ok(files)
    }

    // Transfers
    pub fn save_transfer(&self, t: &TGTransfer) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            r#"
            INSERT OR REPLACE INTO transfers (
                id, file_id, file_name, type, status, progress, bytes_total,
                bytes_transferred, speed_bytes_per_sec, eta_seconds, error,
                created_at, updated_at, local_path
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
            "#,
            params![
                t.id,
                t.file_id,
                t.file_name,
                t.r#type,
                t.status,
                t.progress,
                t.bytes_total,
                t.bytes_transferred,
                t.speed_bytes_per_sec,
                t.eta_seconds,
                t.error,
                t.created_at,
                t.updated_at,
                t.local_path
            ],
        )?;
        Ok(())
    }

    pub fn list_transfers(&self) -> Result<Vec<TGTransfer>, AppError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            r#"
            SELECT id, file_id, file_name, type, status, progress, bytes_total,
                   bytes_transferred, speed_bytes_per_sec, eta_seconds, error,
                   created_at, updated_at, local_path
            FROM transfers
            ORDER BY created_at DESC
            "#
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(TGTransfer {
                id: row.get(0)?,
                file_id: row.get(1)?,
                file_name: row.get(2)?,
                r#type: row.get(3)?,
                status: row.get(4)?,
                progress: row.get(5)?,
                bytes_total: row.get(6)?,
                bytes_transferred: row.get(7)?,
                speed_bytes_per_sec: row.get(8)?,
                eta_seconds: row.get(9)?,
                error: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
                local_path: row.get(13)?,
            })
        })?;

        let mut transfers = Vec::new();
        for t in rows {
            transfers.push(t?);
        }
        Ok(transfers)
    }

    pub fn get_transfer(&self, id: &str) -> Result<Option<TGTransfer>, AppError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            r#"
            SELECT id, file_id, file_name, type, status, progress, bytes_total,
                   bytes_transferred, speed_bytes_per_sec, eta_seconds, error,
                   created_at, updated_at, local_path
            FROM transfers
            WHERE id = ?1
            LIMIT 1
            "#
        )?;
        let mut rows = stmt.query_map(params![id], |row| {
            Ok(TGTransfer {
                id: row.get(0)?,
                file_id: row.get(1)?,
                file_name: row.get(2)?,
                r#type: row.get(3)?,
                status: row.get(4)?,
                progress: row.get(5)?,
                bytes_total: row.get(6)?,
                bytes_transferred: row.get(7)?,
                speed_bytes_per_sec: row.get(8)?,
                eta_seconds: row.get(9)?,
                error: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
                local_path: row.get(13)?,
            })
        })?;
        if let Some(res) = rows.next() {
            Ok(Some(res?))
        } else {
            Ok(None)
        }
    }

    pub fn clear_completed_transfers(&self) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM transfers WHERE status = 'completed' OR status = 'cancelled'", [])?;
        Ok(())
    }

    // Stats
    pub fn get_storage_stats(&self) -> Result<StorageStats, AppError> {
        let conn = self.conn.lock().unwrap();

        let total_files: i64 = conn.query_row(
            "SELECT COUNT(*) FROM files WHERE is_trash = 0",
            [],
            |r| r.get(0),
        ).unwrap_or(0);

        let total_folders: i64 = conn.query_row(
            "SELECT COUNT(*) FROM folders",
            [],
            |r| r.get(0),
        ).unwrap_or(0);

        let total_bytes: i64 = conn.query_row(
            "SELECT COALESCE(SUM(size), 0) FROM files WHERE is_trash = 0",
            [],
            |r| r.get(0),
        ).unwrap_or(0);

        let starred_files: i64 = conn.query_row(
            "SELECT COUNT(*) FROM files WHERE is_starred = 1 AND is_trash = 0",
            [],
            |r| r.get(0),
        ).unwrap_or(0);

        let trash_files: i64 = conn.query_row(
            "SELECT COUNT(*) FROM files WHERE is_trash = 1",
            [],
            |r| r.get(0),
        ).unwrap_or(0);

        Ok(StorageStats {
            total_files,
            total_folders,
            total_bytes_used: total_bytes,
            starred_files,
            trash_files,
        })
    }

    // Settings
    pub fn get_setting(&self, key: &str) -> Result<Option<String>, AppError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
        let mut rows = stmt.query_map(params![key], |r| r.get(0))?;
        if let Some(val) = rows.next() {
            Ok(Some(val?))
        } else {
            Ok(None)
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            params![key, value],
        )?;
        Ok(())
    }

    fn row_to_file(row: &rusqlite::Row) -> rusqlite::Result<TGFile> {
        let is_starred_int: i32 = row.get(13)?;
        let is_trash_int: i32 = row.get(14)?;

        Ok(TGFile {
            id: row.get(0)?,
            name: row.get(1)?,
            parent_folder_id: row.get(2)?,
            telegram_chat_id: row.get(3)?,
            telegram_message_id: row.get(4)?,
            telegram_file_id: row.get(5)?,
            mime_type: row.get(6)?,
            size: row.get(7)?,
            hash: row.get(8)?,
            created_at: row.get(9)?,
            modified_at: row.get(10)?,
            thumbnail_path: row.get(11)?,
            status: row.get(12)?,
            is_starred: is_starred_int == 1,
            is_trash: is_trash_int == 1,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_persistence() {
        let db = Database::in_memory().expect("failed to create in-memory db");
        let user = TGUser {
            id: 99887766,
            username: Some("tg_cloud_tester".to_string()),
            first_name: "Test".to_string(),
            last_name: Some("User".to_string()),
            phone: Some("+1234567890".to_string()),
            is_premium: true,
        };

        db.save_user(&user).expect("save user failed");
        let loaded = db.get_user().expect("get user failed").expect("user not found");
        assert_eq!(loaded.id, 99887766);
        assert_eq!(loaded.username.as_deref(), Some("tg_cloud_tester"));
        assert!(loaded.is_premium);

        db.clear_user().expect("clear user failed");
        assert!(db.get_user().expect("get user failed").is_none());
    }

    #[test]
    fn test_folder_hierarchy_and_file_counts() {
        let db = Database::in_memory().expect("failed to create in-memory db");

        let root_folder = db.create_folder("Documents", None).expect("create folder failed");
        assert_eq!(root_folder.name, "Documents");
        assert!(root_folder.parent_id.is_none());

        let sub_folder = db.create_folder("Projects", Some(root_folder.id.clone()))
            .expect("create subfolder failed");
        assert_eq!(sub_folder.name, "Projects");
        assert_eq!(sub_folder.parent_id.as_deref(), Some(root_folder.id.as_str()));

        // Add file inside root_folder
        let file = TGFile {
            id: "f-1".to_string(),
            name: "resume.pdf".to_string(),
            parent_folder_id: Some(root_folder.id.clone()),
            telegram_chat_id: 112233,
            telegram_message_id: 101,
            telegram_file_id: "tg_f1".to_string(),
            mime_type: "application/pdf".to_string(),
            size: 2048,
            hash: Some("sha256dummy".to_string()),
            created_at: 1000,
            modified_at: 1000,
            thumbnail_path: None,
            status: "synced".to_string(),
            is_starred: false,
            is_trash: false,
        };
        db.insert_file(&file).expect("insert file failed");

        let listed_root = db.list_folders(None).expect("list folders failed");
        assert_eq!(listed_root.len(), 1);
        assert_eq!(listed_root[0].file_count, 1);
        assert_eq!(listed_root[0].total_size, 2048);

        // Rename folder
        db.rename_folder(&root_folder.id, "Important Docs").expect("rename failed");
        let updated = db.list_folders(None).expect("list failed");
        assert_eq!(updated[0].name, "Important Docs");

        // Delete folder
        db.delete_folder(&sub_folder.id).expect("delete failed");
        let sub_listed = db.list_folders(Some(root_folder.id.clone())).expect("list failed");
        assert_eq!(sub_listed.len(), 0);
    }

    #[test]
    fn test_file_operations_star_trash_search() {
        let db = Database::in_memory().expect("failed to create in-memory db");

        let file1 = TGFile {
            id: "f-pdf".to_string(),
            name: "annual_report_2026.pdf".to_string(),
            parent_folder_id: None,
            telegram_chat_id: 100,
            telegram_message_id: 1,
            telegram_file_id: "tg_1".to_string(),
            mime_type: "application/pdf".to_string(),
            size: 5000,
            hash: None,
            created_at: 1000,
            modified_at: 1000,
            thumbnail_path: None,
            status: "synced".to_string(),
            is_starred: false,
            is_trash: false,
        };

        let file2 = TGFile {
            id: "f-img".to_string(),
            name: "vacation_photo.png".to_string(),
            parent_folder_id: None,
            telegram_chat_id: 100,
            telegram_message_id: 2,
            telegram_file_id: "tg_2".to_string(),
            mime_type: "image/png".to_string(),
            size: 15000,
            hash: None,
            created_at: 2000,
            modified_at: 2000,
            thumbnail_path: None,
            status: "synced".to_string(),
            is_starred: false,
            is_trash: false,
        };

        db.insert_file(&file1).expect("insert file1 failed");
        db.insert_file(&file2).expect("insert file2 failed");

        // Star toggle
        let starred = db.toggle_star_file(&file1.id).expect("toggle star failed");
        assert!(starred);
        let starred_files = db.list_files(None, true, false).expect("list starred failed");
        assert_eq!(starred_files.len(), 1);
        assert_eq!(starred_files[0].id, "f-pdf");

        // Search test
        let query = SearchQuery {
            term: "report".to_string(),
            folder_id: None,
            mime_type_category: Some("documents".to_string()),
            sort_by: Some("name".to_string()),
            sort_order: Some("asc".to_string()),
        };
        let search_results = db.search_files(&query).expect("search failed");
        assert_eq!(search_results.len(), 1);
        assert_eq!(search_results[0].name, "annual_report_2026.pdf");

        // Trash test
        db.set_file_trash(&file2.id, true).expect("trash failed");
        let active_files = db.list_files(None, false, false).expect("list failed");
        assert_eq!(active_files.len(), 1);
        assert_eq!(active_files[0].id, "f-pdf");

        let trash_files = db.list_files(None, false, true).expect("list trash failed");
        assert_eq!(trash_files.len(), 1);
        assert_eq!(trash_files[0].id, "f-img");

        // Stats test
        let stats = db.get_storage_stats().expect("get stats failed");
        assert_eq!(stats.total_files, 1);
        assert_eq!(stats.starred_files, 1);
        assert_eq!(stats.trash_files, 1);
        assert_eq!(stats.total_bytes_used, 5000);

        // Permanent delete
        let deleted = db.delete_file_permanent(&file2.id).expect("permanent delete failed");
        assert_eq!(deleted.id, "f-img");
        assert!(db.get_file("f-img").expect("get file failed").is_none());
    }

    #[test]
    fn test_transfers_and_settings() {
        let db = Database::in_memory().expect("failed to create in-memory db");

        let transfer = TGTransfer {
            id: "t-100".to_string(),
            file_id: Some("f-pdf".to_string()),
            file_name: "test.zip".to_string(),
            r#type: "upload".to_string(),
            status: "active".to_string(),
            progress: 45.5,
            bytes_total: 100000,
            bytes_transferred: 45500,
            speed_bytes_per_sec: 1024000.0,
            eta_seconds: 53,
            error: None,
            created_at: 100,
            updated_at: 150,
            local_path: Some("C:\\temp\\test.zip".to_string()),
        };

        db.save_transfer(&transfer).expect("save transfer failed");
        let transfers = db.list_transfers().expect("list transfers failed");
        assert_eq!(transfers.len(), 1);
        assert_eq!(transfers[0].file_name, "test.zip");
        assert_eq!(transfers[0].progress, 45.5);

        // Settings test
        db.set_setting("theme", "dark").expect("set setting failed");
        let theme = db.get_setting("theme").expect("get setting failed");
        assert_eq!(theme.as_deref(), Some("dark"));
    }
}
