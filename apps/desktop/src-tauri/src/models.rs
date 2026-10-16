use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TGUser {
    pub id: i64,
    pub username: Option<String>,
    pub first_name: String,
    pub last_name: Option<String>,
    pub phone: Option<String>,
    pub is_premium: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TGFolder {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub created_at: i64,
    pub modified_at: i64,
    pub file_count: i64,
    pub total_size: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TGFile {
    pub id: String,
    pub name: String,
    pub parent_folder_id: Option<String>,
    pub telegram_chat_id: i64,
    pub telegram_message_id: i32,
    pub telegram_file_id: String,
    pub mime_type: String,
    pub size: i64,
    pub hash: Option<String>,
    pub created_at: i64,
    pub modified_at: i64,
    pub thumbnail_path: Option<String>,
    pub status: String,
    pub is_starred: bool,
    pub is_trash: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TGTransfer {
    pub id: String,
    pub file_id: Option<String>,
    pub file_name: String,
    pub r#type: String, // "upload" | "download"
    pub status: String, // "queued" | "active" | "paused" | "completed" | "failed" | "cancelled"
    pub progress: f64,
    pub bytes_total: i64,
    pub bytes_transferred: i64,
    pub speed_bytes_per_sec: f64,
    pub eta_seconds: i64,
    pub error: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub local_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageStats {
    pub total_files: i64,
    pub total_folders: i64,
    pub total_bytes_used: i64,
    pub starred_files: i64,
    pub trash_files: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthState {
    pub step: String, // "need_credentials" | "need_phone" | "need_code" | "need_password" | "authenticated"
    pub user: Option<TGUser>,
    pub phone: Option<String>,
    pub error: Option<String>,
    pub connected_vault_id: Option<i64>,
    pub connected_vault_title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub telegram_api_id: Option<i32>,
    pub telegram_api_hash: Option<String>,
    pub concurrent_uploads: u32,
    pub concurrent_downloads: u32,
    pub auto_retry: bool,
    pub download_location: String,
    pub theme: String,
    pub app_lock: bool,
    pub vault_chat_id: Option<i64>,
    pub vault_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchQuery {
    pub term: String,
    pub folder_id: Option<String>,
    pub mime_type_category: Option<String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}
