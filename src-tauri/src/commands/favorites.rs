#[tauri::command]
pub fn toggle_favorite(_prompt_id: String) -> Result<bool, String> {
    Err("Nicht implementiert".into())
}

#[tauri::command]
pub fn get_favorites() -> Result<Vec<String>, String> {
    Ok(Vec::new())
}
