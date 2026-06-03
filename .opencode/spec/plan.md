# PromptVault Lite — Implementation Plan

## Übersicht

Der Plan folgt der Speckit-Phasenstruktur. Jede Phase ist ein abgeschlossener, testbarer Meilenstein.

---

## Meilenstein 1: Projekt-Scaffolding (Tag 1)

### Ziel
Lauffähiges Tauri-Projekt mit React-Frontend und Rust-Backend.

### Tasks
1. **Tauri-Projekt initialisieren**
   - `cargo tauri init` mit React/TypeScript-Template
   - Vite-Konfiguration für React
   - Cargo.toml mit Abhängigkeiten (serde, serde_json, serde_yaml, rusqlite, regex, uuid, chrono, notify)
   - package.json mit Abhängigkeiten (react, react-dom, zustand, react-markdown, @tauri-apps/api)

2. **TypeScript-Typen definieren**
   - `src/types/index.ts` mit PromptItem, PromptEvaluation, PromptHygiene, DetectedArtifact
   - Vollständige Typisierung ohne `any`

3. **Rust-Modelle definieren**
   - `src-tauri/src/models/` mit serde-kompatiblen Structs
   - Konvertierung zwischen Rust und TypeScript-Typen

4. **Grundlegendes Tauri-Setup**
   - `main.rs` mit Command-Registrierung
   - `tauri.conf.json` mit Fenster-Konfiguration
   - `.gitignore` für Tauri/Rust/Node

**Abhängigkeiten:** Keine (erster Meilenstein)

---

## Meilenstein 2: Backend — Scanner & Parser (Tag 2–3)

### Ziel
Rekursiver Datei-Scanner und Frontmatter-Parser in Rust.

### Tasks
1. **File Scanner (`scanner/file_scanner.rs`)**
   - Rekursives Durchlaufen von Ordnern
   - `.md`-Filter
   - Symlink-Auflösung (max Tiefe 5)
   - Fehlerbehandlung ohne Scan-Abbruch
   - Unit Tests mit TempDir

2. **Frontmatter Parser (`parser/frontmatter.rs`)**
   - YAML-Frontmatter-Extraktion
   - Fallback-Logik (Titel aus Dateiname, Kategorie aus Ordner)
   - Unit Tests mit Beispieldateien

3. **Markdown Parser (`parser/markdown.rs`)**
   - Trennung von Frontmatter und Content
   - Strukturanalyse (Überschriften-Hierarchie)

4. **Tauri Command: `scan_directory`**
   - Integration von Scanner + Parser
   - Rückgabe als `Vec<PromptItem>`
   - Fortschritts-Feedback via Tauri Events

**Abhängigkeiten:** Meilenstein 1

---

## Meilenstein 3: Backend — Analyse-Engine (Tag 3–4)

### Ziel
Qualitäts- und Hygieneanalyse in Rust.

### Tasks
1. **Qualitätsanalyse (`analysis/quality.rs`)**
   - 10 Kriterien mit regelbasierter Bewertung
   - Rollenerkennung (Regex-Muster: "Du bist", "Agiere als", etc.)
   - Zielerkennung, Kontexterkennung, Strukturanalyse
   - Unit Tests mit Mock-Prompts

2. **Hygieneanalyse (`analysis/hygiene.rs`)**
   - Artefakterkennung (alle 12 Kategorien)
   - Generische Projektnamenerkennung (Eigennamen-Heuristik)
   - Repository-Spuren, Dateipfade (Regex)
   - Issue-Referenzen, Testreports, Log-Zeilen
   - Stacktraces, Build-Output
   - JSON/Code-Dump-Erkennung (Längen-Heuristik)
   - PII-Erkennung (E-Mail, Telefon, Namen)
   - Secret-Erkennung (API-Key-Muster, Token-Muster)

3. **Artefakterkennung (`analysis/artifacts.rs`)**
   - Vereinheitlichte Artefakt-Detektion
   - Kategorisierung und Schweregrad
   - Positionsangabe (Zeile, Spalte)
   - Ersetzungsvorschläge

4. **Empfehlungen (`analysis/recommendations.rs`)**
   - Automatische Verbesserungsvorschläge
   - Generische Ersetzungen vorschlagen

5. **Tauri Commands: `evaluate_prompt`, `analyze_hygiene`, `analyze_all`**
   - Analyse-Pipeline für einzelne und Batch-Analyse

**Abhängigkeiten:** Meilenstein 2

---

## Meilenstein 4: Backend — Persistenz (Tag 4)

### Ziel
SQLite-Datenbank und JSON-Cache für Analyse-Ergebnisse.

### Tasks
1. **SQLite-Integration (`database/sqlite.rs`)**
   - Schema: prompts, evaluations, hygiene, artifacts, favorites
   - CRUD-Operationen
   - Volltextsuche (FTS5)
   - Migrationen

2. **JSON-Cache (`database/cache.rs`)**
   - Fallback wenn SQLite nicht verfügbar
   - Serialisierung/Deserialisierung
   - Cache-Invalidierung (Änderungsdatum)

3. **Tauri Commands: `load_cache`, `save_cache`**

**Abhängigkeiten:** Meilenstein 1–2

---

## Meilenstein 5: Frontend — UI-Grundgerüst (Tag 5–6)

### Ziel
Drei-Spalten-Layout mit Explorer, Details und Analyse-Panel.

### Tasks
1. **Layout & App Shell**
   - `App.tsx` mit 3-Spalten-Layout
   - Resizable Panels
   - CSS-Variablen für Theming
   - Responsive Grundstruktur

2. **Explorer Panel**
   - `FileTree.tsx` mit rekursiver Baumstruktur
   - `TreeNode.tsx` mit Expand/Collapse
   - `SearchBar.tsx` mit Debounce
   - `FilterPanel.tsx` mit Filter-Controls

3. **Details Panel**
   - `PromptHeader.tsx` mit Titel und Badges
   - `PromptMeta.tsx` mit Metadaten-Raster
   - `PromptContent.tsx` mit Markdown-Rendering
   - `ActionBar.tsx` mit Buttons

4. **Analysis Panel**
   - `ScoreDisplay.tsx` mit Farbcodierung
   - `CriteriaList.tsx` mit Balkendiagrammen
   - `HygieneStatus.tsx` mit Status-Icon
   - `ArtifactList.tsx` mit Kategorie/Sev
   - `Recommendations.tsx` mit nummerierter Liste

5. **Zustand Store**
   - `appStore.ts` mit globalem State
   - Actions für Prompt-Auswahl, Filter, Favoriten

6. **Tauri API Integration**
   - `lib/tauri.ts` mit typisierten Wrappern
   - Error-Handling für alle Commands

**Abhängigkeiten:** Meilenstein 1, 2, 3, 4 (Backend muss laufen)

---

## Meilenstein 6: Frontend — Interaktion & Flow (Tag 6–7)

### Ziel
Vollständiger User-Flow vom Ordner-Öffnen bis zur Analyse.

### Tasks
1. **Ordner-Auswahldialog**
   - Tauri Dialog API Integration
   - Scan-Trigger nach Auswahl
   - Ladezustand während Scan

2. **Prompt-Auswahl & Navigation**
   - Klick-Handler für Baumknoten
   - Analyse-Trigger bei Auswahl
   - Tastaturnavigation (Pfeiltasten)

3. **Kopier-Funktion**
   - Clipboard API via Tauri
   - Toast-Benachrichtigung

4. **Favoriten**
   - Toggle-Funktion
   - Persistenz
   - Favoriten-Filter

5. **Export**
   - Export-Dialog mit Format-Auswahl
   - Tauri-Dialog für Zielverzeichnis
   - Export-Trigger via Tauri Command

6. **Suche & Filter**
   - Volltextsuche in Echtzeit
   - Kombinierbare Filter
   - Live-Ergebnisanzahl

**Abhängigkeiten:** Meilenstein 5

---

## Meilenstein 7: Optional Features (Tag 7)

### Ziel
File-Watcher und UI-Polish.

### Tasks
1. **File Watcher**
   - `notify` crate Integration
   - Debounced Re-Scan
   - UI-Update bei Änderungen

2. **UI-Polish**
   - Leere Zustände für alle Panels
   - Lade-Skeletons
   - Tooltips
   - Tastaturkürzel

**Abhängigkeiten:** Meilenstein 6

---

## Meilenstein 8: Tests & Dokumentation (Tag 8–9)

### Ziel
Vollständige Testabdeckung und Dokumentation.

### Tasks
1. **Rust Unit Tests**
   - Scanner-Tests (TempDir-basiert)
   - Parser-Tests (Frontmatter-Varianten)
   - Analyse-Tests (Mock-Prompts für alle Kriterien)
   - Hygiene-Tests (jede Artefakt-Kategorie)
   - Modell-Tests (Serde Roundtrip)

2. **Integration Tests**
   - Tauri Command-Integrationstests
   - End-to-End: Scan → Analysiere → Exportiere

3. **Frontend Tests**
   - Component Tests mit React Testing Library
   - Store Tests (Zustand)
   - Hook Tests

4. **Dokumentation**
   - `README.md` — Projektbeschreibung, Quickstart
   - `INSTALL.md` — Plattformspezifische Installation
   - `ARCHITECTURE.md` — Architekturübersicht
   - `USER_GUIDE.md` — Benutzerhandbuch
   - `TESTING.md` — Testanleitung
   - `CHANGELOG.md` — Version History

**Abhängigkeiten:** Meilenstein 1–7

---

## Abhängigkeitsgraph

```
M1 (Scaffolding)
 ├─→ M2 (Scanner/Parser)
 │    ├─→ M3 (Analyse-Engine)
 │    └─→ M4 (Persistenz)
 ├─→ M5 (UI-Grundgerüst) ← benötigt M2, M3, M4 Backend
 │    └─→ M6 (Interaktion/Flow)
 │         └─→ M7 (Optional/Finalisierung)
 └─→ M8 (Tests/Docs) ← läuft parallel zu M5–M7
```

---

## Risiken

| Risiko | Eintrittsw. | Auswirkung | Mitigation |
|--------|-----------|------------|------------|
| Tauri 2 API-Inkompatibilität | Mittel | Hoch | Offizielle Doku prüfen, Version pinnen |
| Performance bei 10k+ Prompts | Mittel | Mittel | Frühzeitige Lasttests, Virtualisierung |
| Regex-False-Positives bei Artefakterkennung | Hoch | Niedrig | Iteratives Tuning, Test-Suite |
| Plattform-Unterschiede (Pfade, Encoding) | Mittel | Mittel | CI-Tests auf allen Plattformen |
