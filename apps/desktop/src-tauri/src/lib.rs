pub mod error;
pub mod models;
pub mod db;
pub mod telegram;
pub mod transfer_manager;
pub mod commands;

use std::sync::Arc;
use tokio::sync::Mutex;
use directories::ProjectDirs;
use commands::{AppState, *};
use db::Database;
use telegram::TelegramService;
use transfer_manager::TransferManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = dotenvy::dotenv();

    let project_dirs = ProjectDirs::from("com", "tgcloud", "desktop")
        .expect("Failed to determine application directories");
    let data_dir = project_dirs.data_dir();
    std::fs::create_dir_all(data_dir).expect("Failed to create app data directory");

    let db_path = data_dir.join("tgcloud.db");
    let session_path = data_dir.join("tgcloud.session");

    let db = Database::new(&db_path).expect("Failed to initialize SQLite database");

    // Load Telegram API ID and Hash from environment or use official built-in client credentials
    let api_id: i32 = std::env::var("TELEGRAM_API_ID")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(34949606);

    let api_hash = std::env::var("TELEGRAM_API_HASH")
        .unwrap_or_else(|_| "4a68d08a7744c1af7ae394a08718de3d".to_string());

    let telegram_service = Arc::new(Mutex::new(TelegramService::new(
        api_id,
        api_hash,
        session_path,
    )));

    let transfer_manager = Arc::new(TransferManager::new(db.clone(), telegram_service.clone()));

    let app_state = AppState {
        db,
        telegram: telegram_service,
        transfers: transfer_manager,
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            get_auth_state,
            send_phone_code,
            verify_phone_code,
            submit_2fa_password,
            logout,
            list_folders,
            create_folder,
            rename_folder,
            move_folder,
            delete_folder,
            list_files,
            get_file,
            rename_file,
            move_file,
            toggle_star_file,
            move_file_to_trash,
            restore_file_from_trash,
            delete_file_permanent,
            search_files,
            get_storage_stats,
            start_upload,
            start_download,
            list_transfers,
            pause_transfer,
            resume_transfer,
            cancel_transfer,
            clear_completed_transfers,
            get_settings,
            save_settings,
            open_file_in_os
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
