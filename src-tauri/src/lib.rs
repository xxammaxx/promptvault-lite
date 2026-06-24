pub mod analysis;
pub mod commands;
pub mod database;
pub mod models;
pub mod parser;
pub mod scanner;

use crate::database::Database;
use commands::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState::new())
        .setup(|app| {
            log::info!("PromptVault Lite gestartet");

            // ADR-006: Database als separates tauri::State registrieren
            let db_path = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("App-Datenverzeichnis nicht verfügbar: {}", e))?
                .join("promptvault.db");

            // Stelle sicher, dass das übergeordnete Verzeichnis existiert,
            // bevor die SQLite-Datenbank geöffnet/erstellt wird.
            // Fix für: Windows-Installer-Startup-Crash (BEX64 / panic=abort)
            // Root Cause: app_data_dir() liefert Pfad, der nicht existiert,
            // und rusqlite::Connection::open() kann die Datei nicht erstellen.
            if let Some(parent) = db_path.parent() {
                std::fs::create_dir_all(parent)
                    .map_err(|e| format!("Konnte Datenbank-Verzeichnis nicht erstellen: {}", e))?;
            }

            let database = Database::new(
                db_path
                    .to_str()
                    .ok_or_else(|| "Ungültiger Pfad für Datenbank".to_string())?,
            )
            .map_err(|e| format!("Datenbank konnte nicht initialisiert werden: {}", e))?;
            app.manage(database);

            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::scan::scan_directory,
            commands::scan::start_file_watcher,
            commands::scan::stop_file_watcher,
            commands::analyze::evaluate_prompt,
            commands::analyze::analyze_hygiene,
            commands::analyze::analyze_all,
            commands::favorites::toggle_favorite,
            commands::favorites::get_favorites,
            commands::export::export_json,
            commands::export::export_markdown,
            commands::export::export_zip,
            commands::persistence::load_cache,
            commands::persistence::save_cache,
            // Action Layer Commands (Issue #90)
            commands::actions::detect_artifacts_action,
            commands::actions::create_prompt,
            commands::actions::update_prompt,
        ])
        .run(tauri::generate_context!())
        .expect("Fehler beim Starten der Tauri-Anwendung");
}
