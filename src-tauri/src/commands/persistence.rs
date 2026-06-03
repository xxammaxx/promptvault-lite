use crate::commands::AppState;
use crate::models::PromptItem;

#[tauri::command]
pub fn load_cache(state: tauri::State<'_, AppState>) -> Result<Vec<PromptItem>, String> {
    state
        .prompts
        .lock()
        .map(|p| p.clone())
        .map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub fn save_cache(
    prompts: Vec<PromptItem>,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    if let Ok(mut cached) = state.prompts.lock() {
        *cached = prompts;
    }
    Ok(())
}
