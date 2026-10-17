pub mod error;
pub mod models;
pub mod db;
pub mod session;
pub mod telegram;
pub mod transfer_manager;
pub mod commands;
pub mod crypto;
pub mod sync_watcher;

use std::sync::Arc;
use tokio::sync::Mutex;
use commands::{AppState, *};
use db::Database;
use telegram::TelegramService;
use transfer_manager::TransferManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = dotenvy::dotenv();

    tauri::Builder::default()
        .setup(|app| {
            use tauri::Manager;

            #[cfg(target_os = "android")]
            let data_dir = app.path().app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("/data/data/com.tgcloud.desktop/files"));

            #[cfg(not(target_os = "android"))]
            let data_dir = app.path().app_data_dir()
                .or_else(|_| {
                    directories::ProjectDirs::from("com", "tgcloud", "desktop")
                        .map(|p| p.data_dir().to_path_buf())
                        .ok_or(tauri::Error::UnknownPath)
                })
                .unwrap_or_else(|_| std::path::PathBuf::from("."));

            let _ = std::fs::create_dir_all(&data_dir);

            let db_path = data_dir.join("tgcloud.db");
            let session_path = data_dir.join("tgcloud.session");

            let db = Database::new(&db_path).unwrap_or_else(|e| {
                eprintln!("Warning: failed to open SQLite at {:?}: {}, using in-memory DB", db_path, e);
                Database::in_memory().expect("Failed to initialize in-memory SQLite database")
            });

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

            app.manage(app_state);

            // System Tray integration for desktop platforms
            #[cfg(not(target_os = "android"))]
            {
                use tauri::menu::{Menu, MenuItem};
                use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState, TrayIconEvent};

                if let (Ok(show_hide), Ok(quit)) = (
                    MenuItem::with_id(app, "show_hide", "Show / Hide TGCloud", true, None::<&str>),
                    MenuItem::with_id(app, "quit", "Quit TGCloud", true, None::<&str>),
                ) {
                    if let Ok(menu) = Menu::with_items(app, &[&show_hide, &quit]) {
                        let _ = TrayIconBuilder::new()
                            .menu(&menu)
                            .show_menu_on_left_click(false)
                            .on_menu_event(|app, event| {
                                match event.id.as_ref() {
                                    "show_hide" => {
                                        if let Some(window) = app.get_webview_window("main") {
                                            if window.is_visible().unwrap_or(false) {
                                                let _ = window.hide();
                                            } else {
                                                let _ = window.show();
                                                let _ = window.set_focus();
                                            }
                                        }
                                    }
                                    "quit" => {
                                        app.exit(0);
                                    }
                                    _ => {}
                                }
                            })
                            .on_tray_icon_event(|tray, event| {
                                if let TrayIconEvent::Click {
                                    button: MouseButton::Left,
                                    button_state: MouseButtonState::Up,
                                    ..
                                } = event {
                                    let app = tray.app_handle();
                                    if let Some(window) = app.get_webview_window("main") {
                                        if window.is_visible().unwrap_or(false) {
                                            let _ = window.hide();
                                        } else {
                                            let _ = window.show();
                                            let _ = window.set_focus();
                                        }
                                    }
                                }
                            })
                            .build(app);
                    }
                }
            }

            Ok(())
        })
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
            sync_telegram_saved_messages,
            start_upload,
            upload_file_bytes,
            start_download,
            list_transfers,
            pause_transfer,
            resume_transfer,
            cancel_transfer,
            clear_completed_transfers,
            get_settings,
            save_settings,
            open_file_in_os,
            pick_files_dialog,
            pick_folder_dialog,
            pick_save_file_dialog,
            encrypt_and_upload,
            decrypt_file,
            get_sync_folder,
            set_sync_folder,
            start_folder_watcher
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
