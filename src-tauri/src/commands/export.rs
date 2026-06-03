#[tauri::command]
pub fn export_json(_prompt_ids: Vec<String>, _export_path: String) -> Result<(), String> {
    Err("Nicht implementiert".into())
}

#[tauri::command]
pub fn export_markdown(_prompt_ids: Vec<String>, _export_path: String) -> Result<(), String> {
    Err("Nicht implementiert".into())
}

#[tauri::command]
pub fn export_zip(_prompt_ids: Vec<String>, _export_path: String) -> Result<(), String> {
    Err("Nicht implementiert".into())
}
