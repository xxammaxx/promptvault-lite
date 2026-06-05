use crate::database::Database;

// --- Innere Logik — testbar ohne Tauri-Kontext (ADR-008) ---

pub fn toggle_favorite_impl(prompt_id: &str, db: &Database) -> Result<bool, String> {
    let prompt = db
        .get_prompt(prompt_id)?
        .ok_or_else(|| format!("Prompt not found: {}", prompt_id))?;

    let new_state = !prompt.is_favorite;
    db.set_favorite(prompt_id, new_state)?;
    Ok(new_state)
}

pub fn get_favorites_impl(db: &Database) -> Result<Vec<String>, String> {
    let prompts = db.load_prompts()?;
    let favorites: Vec<String> = prompts
        .into_iter()
        .filter(|p| p.is_favorite)
        .map(|p| p.id)
        .collect();
    Ok(favorites)
}

// --- Tauri Commands — dünne Wrapper ---

#[tauri::command]
pub fn toggle_favorite(prompt_id: String, db: tauri::State<'_, Database>) -> Result<bool, String> {
    toggle_favorite_impl(&prompt_id, db.inner())
}

#[tauri::command]
pub fn get_favorites(db: tauri::State<'_, Database>) -> Result<Vec<String>, String> {
    get_favorites_impl(db.inner())
}
