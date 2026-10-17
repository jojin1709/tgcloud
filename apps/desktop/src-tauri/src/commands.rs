use std::sync::Arc;
use tauri::{AppHandle, State};
use crate::error::AppError;
use crate::models::{AppSettings, AuthState, SearchQuery, StorageStats, TGFile, TGFolder, TGTransfer, TGUser};
use crate::db::Database;
use crate::telegram::SharedTelegramService;
use crate::transfer_manager::{TransferControl, TransferManager};

pub struct AppState {
    pub db: Database,
    pub telegram: SharedTelegramService,
    pub transfers: Arc<TransferManager>,
}

// Authentication Commands
#[tauri::command]
pub async fn get_auth_state(state: State<'_, AppState>) -> Result<AuthState, AppError> {
    let db_user = state.db.get_user()?;
    let tg = state.telegram.lock().await;

    let (connected_vault_id, connected_vault_title) = if db_user.is_some() {
        match tg.get_or_create_vault_chat().await {
            Ok((cid, title)) => (Some(cid), Some(title)),
            Err(_) => (None, None),
        }
    } else {
        (None, None)
    };

    let step = if db_user.is_some() {
        "authenticated".to_string()
    } else {
        "need_phone".to_string()
    };

    Ok(AuthState {
        step,
        user: db_user,
        phone: None,
        error: None,
        connected_vault_id,
        connected_vault_title,
    })
}

#[tauri::command]
pub async fn send_phone_code(state: State<'_, AppState>, phone: String) -> Result<(), AppError> {
    let mut tg = state.telegram.lock().await;
    tg.request_login_code(&phone).await
}

#[tauri::command]
pub async fn verify_phone_code(state: State<'_, AppState>, code: String) -> Result<TGUser, AppError> {
    let mut tg = state.telegram.lock().await;
    let user = tg.sign_in_code(&code).await?;
    state.db.save_user(&user)?;
    Ok(user)
}

#[tauri::command]
pub async fn submit_2fa_password(state: State<'_, AppState>, password: String) -> Result<TGUser, AppError> {
    let mut tg = state.telegram.lock().await;
    let user = tg.check_password(&password).await?;
    state.db.save_user(&user)?;
    Ok(user)
}

#[tauri::command]
pub async fn logout(state: State<'_, AppState>) -> Result<(), AppError> {
    let mut tg = state.telegram.lock().await;
    tg.logout().await?;
    state.db.clear_user()?;
    Ok(())
}

// Folder Commands
#[tauri::command]
pub fn list_folders(state: State<'_, AppState>, parent_id: Option<String>) -> Result<Vec<TGFolder>, AppError> {
    state.db.list_folders(parent_id)
}

#[tauri::command]
pub fn create_folder(
    state: State<'_, AppState>,
    name: String,
    parent_id: Option<String>,
) -> Result<TGFolder, AppError> {
    state.db.create_folder(&name, parent_id)
}

#[tauri::command]
pub fn rename_folder(state: State<'_, AppState>, id: String, new_name: String) -> Result<(), AppError> {
    state.db.rename_folder(&id, &new_name)
}

#[tauri::command]
pub fn move_folder(
    state: State<'_, AppState>,
    id: String,
    new_parent_id: Option<String>,
) -> Result<(), AppError> {
    state.db.move_folder(&id, new_parent_id)
}

#[tauri::command]
pub fn delete_folder(state: State<'_, AppState>, id: String) -> Result<(), AppError> {
    state.db.delete_folder(&id)
}

// File Commands
#[tauri::command]
pub fn list_files(
    state: State<'_, AppState>,
    folder_id: Option<String>,
    starred_only: Option<bool>,
    trash_only: Option<bool>,
) -> Result<Vec<TGFile>, AppError> {
    state.db.list_files(
        folder_id,
        starred_only.unwrap_or(false),
        trash_only.unwrap_or(false),
    )
}

#[tauri::command]
pub async fn sync_telegram_saved_messages(
    state: State<'_, AppState>,
    target_folder_id: Option<String>,
) -> Result<usize, AppError> {
    let mut telegram = state.telegram.lock().await;
    if !telegram.is_authorized().await.unwrap_or(false) {
        return Ok(0);
    }

    let files_from_tg = telegram.fetch_saved_messages_files().await?;
    let mut inserted_count = 0;

    for (msg_id, name, size, mime, date) in files_from_tg {
        if !state.db.has_file_by_message_id(msg_id)? {
            let file_id = uuid::Uuid::new_v4().to_string();
            let new_file = TGFile {
                id: file_id,
                name,
                parent_folder_id: target_folder_id.clone(),
                telegram_chat_id: 0,
                telegram_message_id: msg_id,
                telegram_file_id: format!("tg_msg_{}", msg_id),
                mime_type: mime,
                size,
                hash: None,
                created_at: date,
                modified_at: date,
                thumbnail_path: None,
                status: "synced".to_string(),
                is_starred: false,
                is_trash: false,
            };
            if state.db.insert_file(&new_file).is_ok() {
                inserted_count += 1;
            }
        }
    }

    Ok(inserted_count)
}

#[tauri::command]
pub fn get_file(state: State<'_, AppState>, id: String) -> Result<Option<TGFile>, AppError> {
    state.db.get_file(&id)
}

#[tauri::command]
pub fn rename_file(state: State<'_, AppState>, id: String, new_name: String) -> Result<(), AppError> {
    state.db.rename_file(&id, &new_name)
}

#[tauri::command]
pub fn move_file(
    state: State<'_, AppState>,
    id: String,
    new_parent_folder_id: Option<String>,
) -> Result<(), AppError> {
    state.db.move_file(&id, new_parent_folder_id)
}

#[tauri::command]
pub fn toggle_star_file(state: State<'_, AppState>, id: String) -> Result<bool, AppError> {
    state.db.toggle_star_file(&id)
}

#[tauri::command]
pub fn move_file_to_trash(state: State<'_, AppState>, id: String) -> Result<(), AppError> {
    state.db.set_file_trash(&id, true)
}

#[tauri::command]
pub fn restore_file_from_trash(state: State<'_, AppState>, id: String) -> Result<(), AppError> {
    state.db.set_file_trash(&id, false)
}

#[tauri::command]
pub async fn delete_file_permanent(state: State<'_, AppState>, id: String) -> Result<(), AppError> {
    let file = state.db.delete_file_permanent(&id)?;
    // Delete from Telegram storage
    let mut tg = state.telegram.lock().await;
    let _ = tg.delete_message(file.telegram_chat_id, file.telegram_message_id).await;
    Ok(())
}

#[tauri::command]
pub fn search_files(state: State<'_, AppState>, query: SearchQuery) -> Result<Vec<TGFile>, AppError> {
    state.db.search_files(&query)
}

#[tauri::command]
pub fn get_storage_stats(state: State<'_, AppState>) -> Result<StorageStats, AppError> {
    state.db.get_storage_stats()
}

// Transfer Commands
#[tauri::command]
pub async fn start_upload(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    file_path: String,
    parent_folder_id: Option<String>,
) -> Result<String, AppError> {
    state.transfers.start_upload(app_handle, file_path, parent_folder_id).await
}

#[tauri::command]
pub async fn upload_file_bytes(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    file_name: String,
    data: Vec<u8>,
    parent_folder_id: Option<String>,
) -> Result<String, AppError> {
    use tauri::Manager;
    let base_cache = app_handle
        .path()
        .app_cache_dir()
        .unwrap_or_else(|_| std::env::temp_dir());
    let temp_dir = base_cache.join("tgcloud_uploads");
    let _ = std::fs::create_dir_all(&temp_dir);
    let temp_path = temp_dir.join(&file_name);
    std::fs::write(&temp_path, data)?;
    state.transfers.start_upload(app_handle, temp_path.to_string_lossy().to_string(), parent_folder_id).await
}

#[tauri::command]
pub async fn start_download(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    file_id: String,
    destination_path: String,
) -> Result<String, AppError> {
    state.transfers.start_download(app_handle, file_id, destination_path).await
}

#[tauri::command]
pub async fn list_transfers(state: State<'_, AppState>) -> Result<Vec<TGTransfer>, AppError> {
    state.transfers.get_transfers().await
}

#[tauri::command]
pub async fn pause_transfer(state: State<'_, AppState>, id: String) -> Result<(), AppError> {
    state.transfers.control_transfer(&id, TransferControl::Pause).await
}

#[tauri::command]
pub async fn resume_transfer(state: State<'_, AppState>, id: String) -> Result<(), AppError> {
    state.transfers.control_transfer(&id, TransferControl::Resume).await
}

#[tauri::command]
pub async fn cancel_transfer(state: State<'_, AppState>, id: String) -> Result<(), AppError> {
    state.transfers.control_transfer(&id, TransferControl::Cancel).await
}

#[tauri::command]
pub fn clear_completed_transfers(state: State<'_, AppState>) -> Result<(), AppError> {
    state.db.clear_completed_transfers()
}

// Settings & System Commands
#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, AppError> {
    let raw_down = state.db.get_setting("download_location")?;
    let download_location = raw_down.unwrap_or_else(|| {
        directories::UserDirs::new()
            .and_then(|u| u.download_dir().map(|p| p.to_string_lossy().to_string()))
            .unwrap_or_else(|| "C:\\Downloads".to_string())
    });

    let theme = state.db.get_setting("theme")?.unwrap_or_else(|| "dark".to_string());

    Ok(AppSettings {
        telegram_api_id: None,
        telegram_api_hash: None,
        concurrent_uploads: 3,
        concurrent_downloads: 3,
        auto_retry: true,
        download_location,
        theme,
        app_lock: false,
        vault_chat_id: None,
        vault_name: Some("TGCloud Personal Vault".to_string()),
    })
}

#[tauri::command]
pub fn save_settings(state: State<'_, AppState>, settings: AppSettings) -> Result<(), AppError> {
    state.db.set_setting("download_location", &settings.download_location)?;
    state.db.set_setting("theme", &settings.theme)?;
    Ok(())
}

#[tauri::command]
pub fn open_file_in_os(file_path: String) -> Result<(), AppError> {
    #[cfg(not(target_os = "android"))]
    {
        open::that(&file_path).map_err(|e| AppError::io_error(e.to_string()))
    }
    #[cfg(target_os = "android")]
    {
        let _ = file_path;
        Ok(())
    }
}

#[tauri::command]
pub async fn pick_files_dialog() -> Result<Vec<String>, AppError> {
    #[cfg(not(target_os = "android"))]
    {
        let files = rfd::AsyncFileDialog::new()
            .set_title("Select Files to Upload to Telegram")
            .pick_files()
            .await;

        let paths = files
            .unwrap_or_default()
            .into_iter()
            .map(|f| f.path().to_string_lossy().to_string())
            .collect();

        Ok(paths)
    }
    #[cfg(target_os = "android")]
    {
        Ok(vec![])
    }
}

#[tauri::command]
pub async fn pick_folder_dialog() -> Result<Option<String>, AppError> {
    #[cfg(not(target_os = "android"))]
    {
        let folder = rfd::AsyncFileDialog::new()
            .set_title("Select Download Directory")
            .pick_folder()
            .await;

        Ok(folder.map(|f| f.path().to_string_lossy().to_string()))
    }
    #[cfg(target_os = "android")]
    {
        Ok(None)
    }
}

#[tauri::command]
pub async fn pick_save_file_dialog(default_name: String) -> Result<Option<String>, AppError> {
    #[cfg(not(target_os = "android"))]
    {
        let mut dialog = rfd::AsyncFileDialog::new()
            .set_title("Save Downloaded File As")
            .set_file_name(&default_name);

        if let Some(user_dirs) = directories::UserDirs::new() {
            if let Some(download_dir) = user_dirs.download_dir() {
                dialog = dialog.set_directory(download_dir);
            }
        }

        let file = dialog.save_file().await;
        Ok(file.map(|f| f.path().to_string_lossy().to_string()))
    }
    #[cfg(target_os = "android")]
    {
        Ok(None)
    }
}

