use crate::models::PromptItem;
use crate::scanner::{file_scanner, DebouncedWatcher};
use std::sync::Mutex;

/// Globaler App-State mit zwischengespeicherten Prompts
pub struct AppState {
    pub prompts: Mutex<Vec<PromptItem>>,
    pub watcher: Mutex<DebouncedWatcher>,
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

impl AppState {
    pub fn new() -> Self {
        Self {
            prompts: Mutex::new(Vec::new()),
            watcher: Mutex::new(DebouncedWatcher::new()),
        }
    }
}

/// Scannt ein Verzeichnis und aktualisiert den App-State
#[tauri::command]
pub fn scan_directory(
    path: String,
    state: tauri::State<'_, AppState>,
    app_handle: tauri::AppHandle,
) -> Result<Vec<PromptItem>, String> {
    let prompts = file_scanner::scan_directory(&path)?;

    // Update App-State
    if let Ok(mut cached) = state.prompts.lock() {
        *cached = prompts.clone();
    }

    // Auto-start watcher after scan
    if let Ok(mut watcher) = state.watcher.lock() {
        if let Err(e) = watcher.start_watching(&path, app_handle.clone()) {
            log::warn!("Watcher konnte nicht gestartet werden: {}", e);
        }
    }

    Ok(prompts)
}

/// Startet den File-Watcher für den angegebenen Pfad
#[tauri::command]
pub fn start_file_watcher(
    path: String,
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state
        .watcher
        .lock()
        .map_err(|e| format!("Lock-Fehler: {}", e))?
        .start_watching(&path, app_handle)
}

/// Stoppt den File-Watcher
#[tauri::command]
pub fn stop_file_watcher(state: tauri::State<'_, AppState>) -> Result<(), String> {
    state
        .watcher
        .lock()
        .map_err(|e| format!("Lock-Fehler: {}", e))?
        .stop_watching();
    Ok(())
}
