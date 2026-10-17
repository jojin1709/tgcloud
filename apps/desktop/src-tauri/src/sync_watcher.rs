use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::{Path, PathBuf};
use tokio::sync::mpsc;
use tauri::{AppHandle, Emitter};

pub struct SyncWatcher {
    sync_dir: PathBuf,
    is_active: bool,
}

impl SyncWatcher {
    pub fn new(sync_dir: PathBuf) -> Self {
        Self {
            sync_dir,
            is_active: false,
        }
    }

    pub fn default_sync_dir() -> PathBuf {
        directories::UserDirs::new()
            .map(|u| u.home_dir().join("TGCloud"))
            .unwrap_or_else(|| PathBuf::from("TGCloud"))
    }

    pub fn start(&mut self, app_handle: AppHandle) -> Result<(), String> {
        let path = self.sync_dir.clone();
        if !path.exists() {
            let _ = std::fs::create_dir_all(&path);
        }

        let (tx, mut rx) = mpsc::channel::<PathBuf>(100);

        // Notify watcher runs on a native thread
        let watch_path = path.clone();
        let mut watcher = match RecommendedWatcher::new(
            move |res: Result<Event, notify::Error>| {
                if let Ok(event) = res {
                    match event.kind {
                        EventKind::Create(_) | EventKind::Modify(_) => {
                            for file_path in event.paths {
                                if file_path.is_file() {
                                    // Ignore hidden/temp files
                                    if let Some(file_name) = file_path.file_name().and_then(|n| n.to_str()) {
                                        if file_name.starts_with('.') 
                                            || file_name.starts_with('~') 
                                            || file_name.ends_with(".tmp")
                                            || file_name.ends_with(".crdownload")
                                            || file_name == "desktop.ini" {
                                            continue;
                                        }
                                    }
                                    let _ = tx.blocking_send(file_path);
                                }
                            }
                        }
                        _ => {}
                    }
                }
            },
            Config::default(),
        ) {
            Ok(w) => w,
            Err(e) => return Err(format!("Failed to initialize directory watcher: {}", e)),
        };

        if let Err(e) = watcher.watch(&watch_path, RecursiveMode::Recursive) {
            return Err(format!("Failed to watch directory {:?}: {}", watch_path, e));
        }

        self.is_active = true;

        // Async worker to debounce and emit auto-sync events
        tokio::spawn(async move {
            // Keep watcher alive inside the thread
            let _watcher = watcher;
            let mut last_processed = std::collections::HashMap::<PathBuf, tokio::time::Instant>::new();

            while let Some(detected_file) = rx.recv().await {
                // Debounce events within 2 seconds for the same file
                let now = tokio::time::Instant::now();
                if let Some(last_time) = last_processed.get(&detected_file) {
                    if now.duration_since(*last_time).as_secs() < 2 {
                        continue;
                    }
                }
                last_processed.insert(detected_file.clone(), now);

                // Wait 500ms for file write handle to flush/close
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

                if detected_file.exists() {
                    let file_str = detected_file.to_string_lossy().to_string();
                    let _ = app_handle.emit("sync-file-detected", file_str);
                }
            }
        });

        Ok(())
    }

    pub fn get_sync_dir(&self) -> &Path {
        &self.sync_dir
    }

    pub fn is_running(&self) -> bool {
        self.is_active
    }
}
