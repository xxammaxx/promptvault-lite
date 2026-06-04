---
title: Changelog
description: Versionshinweise für PromptVault Lite.
version: 1.3.0
---

# Changelog

## v1.3.0 — Phase 3: Performance & Plattform-Härtung

**Datum:** 2026-06-04

### Performance

- **File-Tree O(1)-Lookup:** `siblings.find()` (O(n) pro Pfadsegment) ersetzt durch `Map<string, FileTreeNode>` — bis zu 50x schneller bei großen Vaults (>500 Prompts) (#11)
- **useMemo-Memoization:** `FileTree.tsx` ruft `fileTree()` jetzt nur noch 1x pro Render auf (vorher 2x). Invalidation über `prompts`/`evaluations`/`filters` State-Slices — keine Stale-Closure-Bugs (#11)

### Technische Schulden

- **0 Clippy-Warnings:** 14 Warnings eliminiert — 10 per `cargo clippy --fix`, 4 manuell (manual_clamp, dead_code, type_complexity, too_many_arguments) (#12)
- `Default`-Implementierung für `AppState` und `DebouncedWatcher`
- `CacheData` Type-Alias für komplexen Rückgabetyp in `cache.rs`
- Unbenutzte `PromptItem::new()` und `newline_count` entfernt

### Plattform-Härtung

- **5 neue Rust-Plattformtests:** Pfad-Traversal im Root-Pfad, Windows-Backslash-Speicherung, gemischte Pfadtrenner, tief verschachtelte Pfade, Symlink-Following-Dokumentation (#13)
- **7 neue Frontend-Plattformtests:** Windows-Backslash-Normalisierung, gemischte Trennzeichen, `../`-Segment-Handling, UNC-ähnliche Pfade, Drive-Letter-Pfade, Sortierreihenfolge, leerer Vault (#13)

### Tests

- **93 Rust-Tests** (+5 neu) — alle grün
- **58 Frontend-Tests** (+7 neu) — alle grün
- `cargo clippy --all-targets` — **0 Warnings**
- `tsc --noEmit` — ohne Fehler
- `cargo fmt` — clean

### Sicherheit

- Security-Agent-Analyse: Symlink-Following dokumentiert (CVSS 3.1: 2.8 Low), Pfad-Traversal im Scanner als akzeptiertes Verhalten klassifiziert (#13)
- fileTree() als nicht-filesystemzugreifend bestätigt (kein direktes Path-Traversal-Risiko)

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
