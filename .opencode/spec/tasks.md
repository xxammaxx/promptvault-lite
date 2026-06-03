# PromptVault Lite — Task Breakdown

## Meilenstein 1: Projekt-Scaffolding

### T1.1 — Tauri-Projekt initialisieren [2h]
- [ ] `pnpm create vite` mit React/TypeScript Template
- [ ] `cargo tauri init` im Projekt-Root
- [ ] Tauri-Konfiguration (`tauri.conf.json`)
- [ ] Vite-Konfiguration mit Tauri-Plugin
- [ ] `.gitignore` für Rust + Node
- **Akzeptanz:** `cargo tauri dev` startet Fenster mit React-App

### T1.2 — Rust-Abhängigkeiten definieren [30m]
- [ ] `Cargo.toml` mit: serde, serde_json, serde_yaml, rusqlite, regex, uuid, chrono, notify, tempfile (dev), walkdir
- [ ] Feature-Flags für SQLite (bundled)

### T1.3 — TypeScript-Konfiguration & Abhängigkeiten [30m]
- [ ] `package.json` mit: react, react-dom, zustand, react-markdown, react-syntax-highlighter, @tauri-apps/api, @tauri-apps/plugin-dialog, @tauri-apps/plugin-clipboard-manager
- [ ] `tsconfig.json` mit strict mode
- [ ] ESLint + Prettier Konfiguration

### T1.4 — TypeScript-Typen definieren [1h]
- [ ] `src/types/index.ts` mit allen Typen aus der Spec
- [ ] Vollständig, keine `any`, alle Properties dokumentiert
- **Akzeptanz:** TypeScript-Kompilierung ohne Fehler

### T1.5 — Rust-Modelle definieren [1h]
- [ ] `src-tauri/src/models/prompt.rs` — PromptItem struct
- [ ] `src-tauri/src/models/evaluation.rs` — PromptEvaluation struct
- [ ] `src-tauri/src/models/hygiene.rs` — PromptHygiene struct
- [ ] `src-tauri/src/models/artifact.rs` — DetectedArtifact struct
- [ ] Serde-Derives für alle Structs
- [ ] `src-tauri/src/models/mod.rs`
- **Akzeptanz:** `cargo check` ohne Fehler

---

## Meilenstein 2: Backend — Scanner & Parser

### T2.1 — File Scanner [3h]
- [ ] `scanner/file_scanner.rs` — Rekursiver Markdown-Scanner
- [ ] Symlink-Auflösung (max Tiefe 5)
- [ ] Fehlerbehandlung: unlesbare Dateien loggen, nicht abbrechen
- [ ] `.md`-Filter
- [ ] Ergebnis: `Vec<ScannedFile>` mit Pfad, Größe, Änderungsdatum
- [ ] Unit Tests mit `tempfile::TempDir`

### T2.2 — Frontmatter Parser [2h]
- [ ] `parser/frontmatter.rs` — YAML-Frontmatter-Extraktion
- [ ] Regex-basierte Trennung (`---...---`)
- [ ] Fallback: Titel aus Dateiname, Kategorie aus Ordnername
- [ ] Unit Tests: mit/ohne Frontmatter, invalides YAML

### T2.3 — Markdown Parser [1h]
- [ ] `parser/markdown.rs` — Strukturanalyse
- [ ] Trennung Frontmatter/Content
- [ ] Überschriften-Hierarchie erkennen

### T2.4 — Tauri Command: scan_directory [2h]
- [ ] `commands/scan.rs` — Integration Scanner + Parser
- [ ] Tauri Event für Fortschritt
- [ ] Fehlerbehandlung mit `Result<Vec<PromptItem>, String>`
- [ ] Integrationstest

---

## Meilenstein 3: Backend — Analyse-Engine

### T3.1 — Qualitätsanalyse [4h]
- [ ] `analysis/quality.rs` — 10-Kriterien-Bewertung
- [ ] Rollenerkennung (Regex: "Du bist", "Agiere als", "Handle als", "You are", "Act as")
- [ ] Zielerkennung (Absichtserklärung, Aufgabenbeschreibung)
- [ ] Kontexterkennung (Hintergrundinformation, Domänenwissen)
- [ ] Eingabenerkennung (Input-Definition, Parameter)
- [ ] Vorgehenserkennung (Schritt-für-Schritt, Workflow)
- [ ] Ausgabeformaterkennung (Output-Format, Ergebnisstruktur)
- [ ] Qualitätsanforderungen (Prüfkriterien, Tests)
- [ ] Sicherheitsgrenzen (Einschränkungen, Guardrails)
- [ ] Klarheit (Verständlichkeit, Präzision)
- [ ] Wiederverwendbarkeit (Generik vs. Spezifität)
- [ ] Gewichtete Score-Berechnung
- [ ] Unit Tests für jedes Kriterium

### T3.2 — Hygieneanalyse: Core [3h]
- [ ] `analysis/hygiene.rs` — Hauptmodul
- [ ] Projektartefakte (generische Erkennung von Eigennamen)
- [ ] Repository-Spuren (Regex: `github.com/`, `owner/repo`)
- [ ] Dateipfade (Unix: `/home/`, Windows: `C:\`, relativ: `src/`)
- [ ] Issue-Referenzen (Regex: `(Issue|PR|Bug) #\d+`)
- [ ] Unit Tests für jede Kategorie

### T3.3 — Hygieneanalyse: Reports & Logs [2h]
- [ ] Testreports (Regex: `\d+ passed, \d+ skipped, \d+ failed`)
- [ ] Log-Zeilen (Regex: `(INFO|WARN|ERROR|DEBUG|TRACE)`)
- [ ] Stacktraces (Regex: `at .+:\d+`, `Exception in`, `Traceback`)
- [ ] Build-Output (Regex: `(npm run|cargo|pnpm) (build|test|dev)`)
- [ ] Unit Tests

### T3.4 — Hygieneanalyse: Dumps & Secrets [2h]
- [ ] JSON-Dumps (Heuristik: `{` am Zeilenanfang, >500 Zeichen)
- [ ] Code-Dumps (Heuristik: Codeblöcke >20 Zeilen)
- [ ] PII (E-Mail Regex, Telefon-Regex, Namen-Heuristik)
- [ ] Secrets (API-Key-Muster, Token-Muster, Passwort-Indikatoren)
- [ ] Secrets sind immer CRITICAL severity
- [ ] Unit Tests

### T3.5 — Artefakterkennung & Empfehlungen [2h]
- [ ] `analysis/artifacts.rs` — Vereinheitlichte Detektion
- [ ] Kategorisierung, Schweregrad, Position
- [ ] Ersetzungsvorschläge (`{PROJECT_NAME}`, `{ISSUE_ID}`, etc.)
- [ ] `analysis/recommendations.rs` — Generierung
- [ ] Unit Tests

### T3.6 — Tauri Commands: Analyse [2h]
- [ ] `commands/analyze.rs`
- [ ] `evaluate_prompt` — Einzelanalyse
- [ ] `analyze_hygiene` — Einzelhygiene
- [ ] `analyze_all` — Batch-Analyse aller geladenen Prompts
- [ ] Integrationstests

---

## Meilenstein 4: Backend — Persistenz

### T4.1 — SQLite Schema & Setup [2h]
- [ ] `database/sqlite.rs`
- [ ] Schema: prompts, evaluations, hygiene, artifacts, favorites
- [ ] FTS5-Volltextindex für prompts
- [ ] Migrationen (erste Migration: initial schema)

### T4.2 — SQLite CRUD [2h]
- [ ] Insert/Update/Delete für alle Tabellen
- [ ] Batch-Insert für Scan-Ergebnisse
- [ ] Query mit Join für vollständige Prompt-Daten
- [ ] FTS5-Suche

### T4.3 — JSON Cache Fallback [2h]
- [ ] `database/cache.rs`
- [ ] Serialisierung/Deserialisierung aller Modelle
- [ ] Cache-Invalidierung via Änderungsdatum
- [ ] Fallback-Logik in SQLite-Modul

### T4.4 — Tauri Commands: Persistenz [1h]
- [ ] `load_cache` — Lädt gespeicherte Daten
- [ ] `save_cache` — Speichert aktuelle Daten
- [ ] Integration in Scan-Flow

---

## Meilenstein 5: Frontend — UI-Grundgerüst

### T5.1 — App Shell & Layout [2h]
- [ ] `App.tsx` — Drei-Spalten-Layout mit CSS Grid
- [ ] `ResizeHandle.tsx` — Spalten-Resizer
- [ ] CSS-Variablen für Farbpalette
- [ ] Responsive Media Queries
- [ ] Fenster-Titel via Tauri

### T5.2 — Explorer Panel [4h]
- [ ] `ExplorerPanel.tsx` — Container
- [ ] `SearchBar.tsx` — Debounced Suche (300ms)
- [ ] `FilterPanel.tsx` — Kategorie, Score, Hygiene, Tags, Favoriten
- [ ] `FileTree.tsx` — Rekursive Baumstruktur
- [ ] `TreeNode.tsx` — Ordner/Datei mit Icons, Expand/Collapse
- [ ] Score-Badge an Dateiknoten
- [ ] Favoriten-Indikator

### T5.3 — Details Panel [4h]
- [ ] `DetailsPanel.tsx` — Container
- [ ] `PromptHeader.tsx` — Titel, Kategorie-Badge, Favoriten-Stern
- [ ] `PromptMeta.tsx` — Version, Tags, Daten, Pfad
- [ ] `PromptContent.tsx` — Markdown-Rendering mit react-markdown
- [ ] `ActionBar.tsx` — Kopieren, Öffnen, Explorer, Re-Analyse
- [ ] `EmptyState.tsx` — Platzhalter

### T5.4 — Analysis Panel [4h]
- [ ] `AnalysisPanel.tsx` — Container
- [ ] `ScoreDisplay.tsx` — Große Score-Zahl mit Farbe
- [ ] `CriteriaList.tsx` — Kriterien mit Balken
- [ ] `HygieneStatus.tsx` — Status-Icon + Score
- [ ] `ArtifactList.tsx` — Artifakte mit Kategorie/Severity
- [ ] `Recommendations.tsx` — Nummerierte Liste
- [ ] `EmptyState.tsx` — Platzhalter

### T5.5 — Zustand Store [2h]
- [ ] `stores/appStore.ts`
- [ ] State: prompts, selectedPrompt, evaluations, hygiene, filters, favorites, ui
- [ ] Actions: loadPrompts, selectPrompt, toggleFavorite, setFilters, setSearch
- [ ] Selektoren: filteredPrompts, currentEvaluation, currentHygiene

### T5.6 — Tauri API Integration [2h]
- [ ] `lib/tauri.ts` — Typisierte Wrapper für alle Commands
- [ ] `invoke<T>(cmd, args)` mit Fehlerbehandlung
- [ ] Event-Listener für Scan-Fortschritt
- [ ] Typ-Conversions (Rust ↔ TypeScript)

---

## Meilenstein 6: Frontend — Interaktion & Flow

### T6.1 — Ordner-Auswahl & Scan [2h]
- [ ] Tauri Dialog API (`@tauri-apps/plugin-dialog`)
- [ ] Scan-Trigger nach Ordner-Auswahl
- [ ] Loading-State während Scan
- [ ] Fortschrittsanzeige

### T6.2 — Prompt-Auswahl Flow [1h]
- [ ] Klick-Handler: Baumknoten → Details + Analyse
- [ ] Automatische Analyse bei Erstauswahl
- [ ] Tastaturnavigation (Pfeiltasten)

### T6.3 — Kopieren & Öffnen [1h]
- [ ] Clipboard API (`@tauri-apps/plugin-clipboard-manager`)
- [ ] "Im Explorer anzeigen" via Tauri Shell
- [ ] "Datei öffnen" via Tauri Shell (`open` command)
- [ ] Toast-Benachrichtigungen

### T6.4 — Favoriten [1h]
- [ ] Toggle im UI
- [ ] Persistenz via Tauri Command
- [ ] Favoriten-Filter

### T6.5 — Export [2h]
- [ ] Export-Dialog (Dropdown: JSON, Markdown, ZIP)
- [ ] Tauri Dialog für Zielverzeichnis
- [ ] Export-Trigger via Tauri Command
- [ ] Fortschrittsanzeige

### T6.6 — Suche & Filter [2h]
- [ ] Volltextsuche mit Highlighting
- [ ] Filter-Kombination (UND-Verknüpfung)
- [ ] Live-Ergebnisanzahl
- [ ] Filter-Reset

---

## Meilenstein 7: Optional Features & Polish

### T7.1 — File Watcher [3h]
- [ ] `scanner/watcher.rs`
- [ ] `notify` crate Integration
- [ ] Debounced Re-Scan (500ms)
- [ ] UI-Update bei Änderungen
- [ ] Events: created, modified, deleted

### T7.2 — UI-Polish [3h]
- [ ] Loading Skeletons für alle Panels
- [ ] Empty States mit hilfreichen Texten
- [ ] Tooltips an interaktiven Elementen
- [ ] Tastaturkürzel (Strg+F Suche, Strg+O Ordner, etc.)
- [ ] Scroll-Position-Wiederherstellung
- [ ] Animationen (Expand/Collapse, Panel-Wechsel)

---

## Meilenstein 8: Tests & Dokumentation

### T8.1 — Rust Unit Tests [3h]
- [ ] Scanner-Tests (leerer Ordner, verschachtelt, Symlinks, Nicht-md-Dateien)
- [ ] Parser-Tests (Frontmatter-Varianten, invalides YAML, fehlend)
- [ ] Analyse-Tests (jedes Qualitätskriterium, Grenzfälle)
- [ ] Hygiene-Tests (jede Artefakt-Kategorie, False Positives)
- [ ] Modell-Tests (Serde Roundtrip, JSON Serialisierung)
- [ ] `cargo test` muss grün sein

### T8.2 — Rust Integration Tests [2h]
- [ ] Scanner + Parser Integration
- [ ] Scan + Analyse Pipeline
- [ ] SQLite CRUD Integration
- [ ] Tauri Command Tests (mit Test-App)

### T8.3 — Frontend Tests [2h]
- [ ] Component Tests (React Testing Library)
- [ ] Explorer: Rendering, Expand/Collapse, Klick
- [ ] Details: Metadaten-Anzeige, Buttons
- [ ] Analysis: Score-Anzeige, Kriterien
- [ ] Store Tests (Zustand Actions/Selektoren)

### T8.4 — Dokumentation [4h]
- [ ] `README.md` — Projektbeschreibung, Features, Quickstart, Screenshots
- [ ] `INSTALL.md` — Plattform-spezifisch (Linux, Windows, macOS)
- [ ] `ARCHITECTURE.md` — Architekturdiagramm, Module, Datenfluss
- [ ] `USER_GUIDE.md` — Schritt-für-Schritt Anleitung
- [ ] `TESTING.md` — Test-Framework, Ausführung, CI
- [ ] `CHANGELOG.md` — v1.0.0 MVP Release

---

## Zusammenfassung

| Meilenstein | Tasks | Geschätzte Zeit |
|-------------|-------|-----------------|
| M1: Scaffolding | 5 | 5h |
| M2: Scanner/Parser | 4 | 8h |
| M3: Analyse-Engine | 6 | 15h |
| M4: Persistenz | 4 | 7h |
| M5: UI-Grundgerüst | 6 | 18h |
| M6: Interaktion | 6 | 9h |
| M7: Optional/Polish | 2 | 6h |
| M8: Tests/Docs | 4 | 11h |
| **Gesamt** | **37 Tasks** | **~79h** |

---

## Task-Definition-of-Done
Jeder Task gilt als abgeschlossen, wenn:
- [ ] Code implementiert und kompiliert
- [ ] Unit/Integration Tests geschrieben und grün
- [ ] Keine TODO-Kommentare oder Platzhalter
- [ ] Keine ungenutzten Imports oder Dead Code
- [ ] `cargo clippy` ohne Warnings (Rust)
- [ ] ESLint ohne Errors (TypeScript)
- [ ] Code-Review durch review-agent (wenn >50 Zeilen)
