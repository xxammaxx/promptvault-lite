# Feature-Spec: File Watcher (P1)

## User Story

**Als** PromptVault-Nutzer möchte ich, dass Änderungen an meinen Prompt-Dateien automatisch erkannt werden,
**damit** ich nicht manuell neu scannen muss, wenn ich Prompts bearbeite, hinzufüge oder lösche.

## Acceptance Criteria

### AC-1: Watcher starten/stoppen

- [ ] `start_watching(path: &str, app_handle: tauri::AppHandle)` startet notify-Watcher
- [ ] `stop_watching()` stoppt den Watcher und räumt Ressourcen auf
- [ ] Watcher läuft in einem separaten Thread (`std::thread::spawn`)
- [ ] Watcher verwendet `notify::recommended_watcher()` mit Callback
- [ ] `AppState` erhält ein `Option<RecommendedWatcher>`-Feld

### AC-2: Re-Scan bei Dateiänderungen

- [ ] Bei `EventKind::Create` → Datei wird gescannt und zum State hinzugefügt
- [ ] Bei `EventKind::Modify` → Prompt wird neu geparst und aktualisiert
- [ ] Bei `EventKind::Remove` → Prompt wird aus State entfernt
- [ ] Nur `.md`-Dateien werden beachtet (Filter im Event-Handler)
- [ ] Re-Scan verwendet existierende `file_scanner::scan_directory`-Logik

### AC-3: Debouncing (500ms)

- [ ] Debounce-Mechanismus verhindert Kaskaden-Updates
- [ ] Innerhalb von 500ms werden Events für denselben Pfad zusammengefasst
- [ ] Erst nach 500ms Ruhe wird der Re-Scan ausgelöst
- [ ] Verwendung von `std::time::Instant` für Timer-Logik

### AC-4: Tauri Events

- [ ] Bei erkannten Änderungen: `app_handle.emit("watcher:changed", ChangedPayload)`
- [ ] `ChangedPayload` enthält: `{ added: Vec<String>, modified: Vec<String>, removed: Vec<String> }`
- [ ] Frontend-Listener aktualisiert den Store und triggert UI-Refresh
- [ ] Statusleiste zeigt "Dateisystem-Änderung erkannt" für 3 Sekunden

### AC-5: Integration in scan.rs

- [ ] `scan_folder` im Frontend startet automatisch den Watcher nach erstem Scan
- [ ] `scan_folder` stoppt vorherigen Watcher bevor neuer gestartet wird
- [ ] Beim Schließen der App wird der Watcher gestoppt (Tauri `on_window_event`)

## Edge Cases

- Watcher für nicht-existierenden Pfad → `Err("Pfad existiert nicht")`
- Schnelle aufeinanderfolgende Änderungen (Save-while-typing) → Debounce fängt ab
- Gelöschter Ordner während des Watchings → Watcher stoppt mit Log-Meldung
- Bereits laufender Watcher → `start_watching` stoppt alten und startet neuen
- Große Anzahl gleichzeitiger Änderungen → Batch-Processing

## Technische Notizen

- `notify` Crate ist bereits in Cargo.toml (v6, mit `macos_kqueue`)
- `AppState` erweitern um `watcher: Mutex<Option<RecommendedWatcher>>`
- Thread-Safety: `notify::Watcher` ist `Send` aber nicht `Sync` → in `Mutex<Option<...>>` wrappen
- Tauri Event-Emitter: `app_handle.emit("watcher:changed", payload)?`
