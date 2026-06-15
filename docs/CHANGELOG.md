---
title: Changelog
description: Versionshinweise für PromptVault Lite.
version: 1.5.0
---

# Changelog

## v1.5.0 — Phase 5: Feature Completion & Developer Experience

### Unreleased

#### Features

- **Typed Local Action Layer:** 10 typisierte lokale Aktionen (`prompts.search`, `prompts.get`, `prompts.create`, `prompts.update`, `prompts.score`, `prompts.detect_artifacts`, `prompts.optimize`, `collections.list`, `qa.load_fixture`, `qa.compare_score`) mit Schema-validierten Input/Output-Verträgen. Jede Aktion besitzt ein eigenes Request/Response-Schema mit Typsicherheit zur Compile-Zeit. (#90)
- **6 neue Artefakt-Kategorien:** `CHAT_META`, `SCOPE_POLLUTION`, `OCR_RESIDUE`, `ROLE_MISMATCH`, `MISSING_STRUCTURE`, `EVIDENCE_BLOCK` erweitern die Hygieneanalyse um KI-spezifische Prompt-Artefakte. (#90)
- **Read-Only-First-Strategie:** Standardmäßig sind nur lesende Aktionen (`prompts.search`, `prompts.get`, `prompts.score`, `collections.list`) verfügbar. Schreibaktionen erfordern explizite Freigabe über Approval-Gates. (#90)

#### Backend

- **Developer-Mode-Gate:** Neuer `dev_mode`-Schalter steuert den Zugriff auf alle Aktionen. Im Standard-Modus sind ausschließlich lesende Aktionen freigeschaltet. Entwicklermodus aktiviert das vollständige Action-Repertoire inklusive Schreib- und QA-Aktionen. (#90)
- **Evidence-Log:** Jeder Aktionsaufruf wird mit Timestamp, Action-Typ, Parametern und Ergebnisstatus in einer strukturierten Log-Datei aufgezeichnet. Ermöglicht vollständige Audit-Trail-Transparenz. (#90)
- **Schema-Validierung:** Alle Action-Inputs werden vor der Ausführung gegen definierte JSON-Schemata validiert. Bei Schemaverletzung erfolgt ein frühzeitiger Abbruch mit detaillierter Fehlermeldung. (#90)

#### Testing

- **25 Red Tests:** Umfassende Sicherheitsszenarien für den Action Layer – unbefugter Zugriff ohne Developer-Mode, Schema-Verletzungen, fehlende Berechtigungen für Schreibaktionen, Edge-Cases bei leeren Inputs. Alle Tests bestätigen das erwartete Fehlverhalten (Rot-Phase). (#90)

### v1.5.0 (2026-06-05)

#### Features

- **Favoriten-Backend:** `toggle_favorite(prompt_id)` toggled Favoriten-Status via SQLite. `get_favorites()` gibt alle favorisierten Prompt-IDs zurück. Persistenz über Neustarts via `Database::set_favorite()`. ADR-006: Database als separates `tauri::State`. (#24)
- **Score-Filter:** `filteredPrompts()` wertet `evaluations` für `minScore`/`maxScore`-Filter aus. Prompt ohne Evaluation → Score = 0. Nur aktiv wenn Filter nicht Default (0–100). ADR-007: reines Frontend-Feature. (#23)
- **Favoriten-UI:** Button in Detailansicht mit optimistischem UI-Update, Revert bei Backend-Fehler, ARIA-Attribute (`aria-label`, `aria-pressed`). FileTree zeigt ★-Indikator mit `favorite-indicator` CSS-Klasse. (#25)

#### Backend

- **Database-Mutex:** `Database.conn` von `rusqlite::Connection` auf `Mutex<Connection>` umgestellt. Ermöglicht `Send + Sync` für `tauri::State<Database>`. Eigene `lock_conn()`-Hilfsfunktion.
- **ADR-008:** Integrationstests in `command_errors.rs` verwenden `Database::new_in_memory()` und rufen `_impl`-Hilfsfunktionen direkt auf.
- **Neue Rust-Tests:** 5 Integrationstests für Favoriten (unknown_id, set, unset, empty, returns_favorites).

#### Frontend

- **Search-Filter umstrukturiert:** `return`-Early-Exit entfernt — andere Filter (Score, Favoriten) werden jetzt bei aktivem Search-Filter mitgeprüft.
- **toggleFavorite Store-Action async:** Optimistisches UI-Update mit Revert bei `Err`. Import von `@/lib/tauri` `toggleFavorite`.

#### Test Summary

- Rust: 96 lib (1 ignored) + 17 integration = 113 total (0 failures, 0 clippy warnings)
- Frontend: 93 tests (0 failures)
- ESLint: 0 errors, 0 warnings

## v1.4.0 — Phase 4: Security-Härtung & Developer Experience

**Datum:** 2026-06-04

### Security

- **Symlink-Containment:** `scan_directory()` canonicalisiert Root-Pfad und jede gescannte Datei. Externe Symlinks außerhalb des Vault-Roots werden nicht mehr gescannt und mit `log::warn!` protokolliert. CVSS 2.8 Finding aus Phase 3 adressiert (#14)

### Frontend

- **TreeNode React.memo:** Kind-TreeNodes leiten `isExpanded`/`isSelected` jetzt aus dem zustand-Store ab (kein Prop-Drilling mehr). `React.memo` mit Custom-Comparator verhindert unnötige Re-Renders von Kindknoten (#15)
- **Pfad-Sanitization:** `".."`- und `"."`-Segmente werden aus `fileTree()` gefiltert. Absolute Pfade werden relativ zum Vault-Root dargestellt (#16)

### Testing

- **Store-Unit-Tests:** 22 Tests für `fileTree()` und `filteredPrompts()` im neuen `appStore.test.ts` (#18)
- **Command-Fehlerfall-Tests:** 14 Rust-Integrationstests in `command_errors.rs` für alle Tauri Commands (scan, analyze, export, favorites, persistence, watcher) (#19)

### Developer Experience

- **ESLint Strict Mode:** `.eslintrc.json` mit `@typescript-eslint/strict-type-checked` + `react-hooks/recommended`. 0 Errors, 0 Warnings (#20)
- **Pre-commit Hook:** Natives `.git/hooks/pre-commit` Shell-Skript prüft `cargo fmt`, `cargo clippy` und `tsc --noEmit` vor jedem Commit (#21)

### Test Summary (Phase 4 Final)

- Rust: 95 lib tests + 14 integration tests = 109 total (0 failures, 0 clippy warnings)
- Frontend: 84 tests (0 failures)
- ESLint: 0 errors, 0 warnings

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

## v1.2.0 — Phase 2.1 Bugfixes & Härtung

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
