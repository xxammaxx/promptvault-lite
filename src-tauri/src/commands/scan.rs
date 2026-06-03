use crate::models::PromptItem;
use crate::scanner::file_scanner;
use std::sync::Mutex;

/// Globaler App-State mit zwischengespeicherten Prompts
pub struct AppState {
    pub prompts: Mutex<Vec<PromptItem>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            prompts: Mutex::new(Vec::new()),
        }
    }
}

/// Scannt ein Verzeichnis und aktualisiert den App-State
#[tauri::command]
pub fn scan_directory(
    path: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<PromptItem>, String> {
    let prompts = file_scanner::scan_directory(&path)?;

    // Update App-State
    if let Ok(mut cached) = state.prompts.lock() {
        *cached = prompts.clone();
    }

    Ok(prompts)
}
