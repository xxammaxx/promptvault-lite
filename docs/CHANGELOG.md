---
title: Changelog
description: Versionshinweise für PromptVault Lite.
version: 1.2.0
---

# Changelog

## v1.2.0 — Phase 2.1 Bugfixes & Härtung

**Datum:** 2026-06-04

### Bugfixes

- **File-Tree:** Prompts in beliebig tief verschachtelten Verzeichnissen werden korrekt im Explorer-Baum angezeigt (#8)
- **Keyboard-Shortcuts:** IME-Komposition (Japanisch, Chinesisch, Koreanisch) wird erkannt und blockiert keine Shortcuts mehr (#10)

### Tests & Qualität

- **88 Rust-Tests** (79 bestehend + 9 neue Export-Tests) — inkl. JSON, Markdown, ZIP Export-Tests mit TempDir
- **51 Frontend-Tests** (vitest + testing-library) — alle grün
- `cargo clippy` ohne neue Warnings
- `tsc --noEmit` ohne Fehler

### Verbesserungen

- Export-Kernlogik in testbare Hilfsfunktionen extrahiert
- Rekursive Sortierung im File-Tree (Ordner zuerst, dann alphabetisch)
- Versionierung über `CARGO_PKG_VERSION` statt Hardcoding

## v1.1.0 — Phase 2 Release

**Datum:** 2026-06-03

### Neue Features

- **Export-Funktionalität:** JSON, Markdown und ZIP-Export mit Analyse-Scores und Fortschrittsanzeige (#2)
- **File Watcher:** Automatischer Re-Scan bei Dateiänderungen mit 500ms Debounce (#3)
- **Native Icons:** Plattformspezifische Icons für Windows (.ico), macOS (.icns) und Linux (.png) (#4)
- **Keyboard Shortcuts:** Strg+F (Suche), Strg+O (Öffnen), Strg+Shift+A (Analyse), Strg+E (Export), Esc (Zurücksetzen) (#7)

### Tests & Qualität

- **79 Rust-Tests** (64 MVP + 15 Edge-Case) — inkl. Leere-Dateien, Unicode, Binär, Performance
- **51 Frontend-Tests** (vitest + testing-library) — TreeNode, FilterPanel, AnalysisPanel
- `cargo clippy` ohne neue Warnings
- `tsc --noEmit` ohne Fehler

### Verbesserungen

- Export-Dialog mit Format-Auswahl und Accessibility (ARIA, Keyboard, Focus-Trap)
- SearchBar mit Store-Synchronisation für externe Filter-Reset
- Windows-Pfadunterstützung (Backslash-Handling)
- Verbesserte Pfadvalidierung in Export-Commands

## v1.0.0 — MVP Release

**Datum:** 2026-06-03

### Features

- Lokaler Scan von Markdown-Promptordnern
- Rekursiver Explorer-Baum
- Prompt-Detailansicht mit Frontmatter- und Dateimetadaten
- Qualitätsanalyse mit 10 Kriterien
- Hygieneanalyse mit Artefakterkennung
- Kopieren- und Öffnen-Aktionen in der Detailansicht
- Tauri-/Rust-Backend mit lokaler Verarbeitung
- SQLite- und JSON-Cache-Module
- Such- und Filteroberfläche im Explorer
