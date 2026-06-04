# Feature-Spec: Export-Funktionalität (P0)

## User Story

**Als** PromptVault-Nutzer möchte ich meine Promptsammlung in verschiedenen Formaten exportieren können,
**damit** ich sie mit anderen teilen, in anderen Tools weiterverwenden oder archivieren kann.

## Acceptance Criteria

### AC-1: JSON-Export

- [ ] `export_json` akzeptiert eine `Vec<String>` von Prompt-IDs und einen `String`-Exportpfad
- [ ] Exportdatei enthält vollständige PromptItem-Metadaten (title, description, category, version, tags, content, created_at, updated_at)
- [ ] Exportdatei enthält QualityScore und HygieneScore falls vorhanden (aus `evaluations`/`hygiene` lookup)
- [ ] JSON-Struktur: `{ "export_date": "<ISO8601>", "version": "1.1.0", "prompts": [...] }`
- [ ] Valides UTF-8 JSON, `serde_json::to_writer_pretty()`

### AC-2: Markdown-Export

- [ ] `export_markdown` akzeptiert `Vec<String>` von Prompt-IDs und `String`-Exportpfad
- [ ] Einzelne `.md`-Datei mit `---`-getrennten Prompt-Blöcken
- [ ] Jeder Block enthält YAML-Frontmatter mit den Original-Metadaten
- [ ] Jeder Block enthält den vollen Prompt-Inhalt als Markdown-Body
- [ ] Analyse-Scores als Kommentare im Frontmatter (`# quality_score: 85 # hygiene_score: 72`)

### AC-3: ZIP-Export

- [ ] `export_zip` akzeptiert `Vec<String>` von Prompt-IDs und `String`-Exportpfad
- [ ] ZIP enthält alle Original-Markdown-Dateien in ihrer Verzeichnisstruktur
- [ ] ZIP enthält `metadata.json` mit allen PromptItem-Daten + Analyseergebnissen
- [ ] ZIP enthält `index.json` mit Prompt-ID → Dateiname-Mapping
- [ ] Verwendung von `std::io::Write` + `zip`-Crate (in Cargo.toml hinzufügen)

### AC-4: Frontend Integration

- [ ] Export-Button in der Toolbar (neben "Alle analysieren")
- [ ] Format-Auswahl-Dialog: JSON | Markdown | ZIP (Radio-Buttons + Beschreibung)
- [ ] Tauri Save-Dialog (`tauri_plugin_dialog::save()`) für Zielverzeichnis
- [ ] Checkbox "Nur Favoriten exportieren" → filtert `prompt_ids` im Store
- [ ] Fortschrittsanzeige: "Exportiere X von Y Prompts..."

### AC-5: Fehlerbehandlung

- [ ] Leere Prompt-Liste → `Err("Keine Prompts zum Exportieren ausgewählt")`
- [ ] Ungültiger Pfad → `Err("Export-Pfad existiert nicht: {path}")`
- [ ] Schreibfehler → `Err("Fehler beim Schreiben: {io_error}")`
- [ ] Ungültige Prompt-ID → Wird übersprungen mit Warn-Log, Export wird fortgesetzt

## Edge Cases

- Export von 1000+ Prompts → Batch-Verarbeitung, kein Memory-Overflow
- Prompt mit Unicode/Emoji im Titel → Korrekte Serialisierung
- Prompt ohne Analyse → Scores auf null/0 setzen
- Leere Tags-Liste → `"tags": []`
- Fehlende `category` → `"category": "uncategorized"`

## Technische Notizen

- Neue Crate-Dependency: `zip = "0.6"` in Cargo.toml
- `export_json`, `export_markdown`, `export_zip` werden zu echten Implementierungen
- Zugriff auf `evaluations`/`hygiene` über `AppState` (oder als Parameter)
- Fortschritt über Tauri Events an das Frontend: `app_handle.emit("export-progress", payload)`
