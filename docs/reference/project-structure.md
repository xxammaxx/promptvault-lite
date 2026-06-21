---
title: Projektstruktur
description: Vollständige Referenz der Verzeichnis- und Dateistruktur von PromptVault Lite.
version: 1.5.0
---

# Projektstruktur

> Vollständige Übersicht über alle relevanten Verzeichnisse und Dateien.
> Abgeleitet aus dem aktuellen Repository-Stand.

## Root-Ebene

| Datei/Verzeichnis     | Zweck                                                                                |
| --------------------- | ------------------------------------------------------------------------------------ |
| `package.json`        | Node.js-Projektdefinition, Scripts, Dependencies (React, Zustand, Tauri API, Vitest) |
| `vite.config.ts`      | Vite-Konfiguration: React-Plugin, `@`-Alias, Vitest-Umgebung (jsdom), Build-Targets  |
| `tsconfig.json`       | TypeScript-Konfiguration: Strict Mode, `@/`-Path-Alias, ES2021 Target                |
| `tsconfig.node.json`  | TypeScript-Konfiguration für Vite/Node-seitige Dateien                               |
| `.eslintrc.json`      | ESLint Strict-TypeChecked + React-Hooks-Regeln                                       |
| `.eslintignore`       | Von ESLint ausgeschlossene Pfade                                                     |
| `index.html`          | Vite-Einstiegspunkt (HTML-Hülle für React)                                           |
| `pnpm-workspace.yaml` | pnpm-Workspace-Definition (single workspace)                                         |
| `pnpm-lock.yaml`      | Lockfile für reproduzierbare Installationen                                          |
| `AGENTS.md`           | Verbindliche Regeln für KI-Agenten (Cold Context)                                    |
| `CLAUDE.md`           | Claude-spezifische Projektanweisungen                                                |

## `src/` — Frontend (React + TypeScript)

| Pfad                            | Zweck                                                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `main.tsx`                      | React-Einstiegspunkt (`createRoot`, `StrictMode`)                                                                            |
| `App.tsx`                       | Hauptkomponente: Layout, Resize, Toolbar, Drei-Spalten-UI                                                                    |
| `App.css`                       | Globales Styling                                                                                                             |
| `vite-env.d.ts`                 | Vite-Typdefinitionen                                                                                                         |
| `test-setup.ts`                 | Vitest-Setup (`@testing-library/jest-dom`)                                                                                   |
| `stores/appStore.ts`            | **AppStore (Zustand):** UI-State, Filterlogik, FileTree-Konstruktion, Tauri-API-Aufrufe                                      |
| `stores/blueprintStore.ts`      | Blueprint-Store (in Entwicklung)                                                                                             |
| `stores/__tests__/`             | Store-Unit-Tests (appStore.test.ts)                                                                                          |
| `types/index.ts`                | Zentrale Typdefinitionen: `PromptItem`, `PromptEvaluation`, `PromptHygiene`, `FileTreeNode`, `PromptFilters`, Artifact-Typen |
| `lib/tauri.ts`                  | Typisierte Tauri-API-Wrapper: `scanDirectory`, `evaluatePrompt`, `analyzeHygiene`, `export*`, `toggleFavorite`, FileWatcher  |
| `hooks/useExport.ts`            | Export-Logik (Formatwahl, Fortschritt, Fehlerbehandlung)                                                                     |
| `hooks/useKeyboardShortcuts.ts` | Globale Tastaturkürzel (Strg+O, F, A, E, Esc)                                                                                |

### `src/components/`

| Komponente              | Pfad                                    | Zweck                                                                |
| ----------------------- | --------------------------------------- | -------------------------------------------------------------------- |
| **Explorer**            | `components/explorer/`                  | Linke Spalte                                                         |
| `ExplorerPanel.tsx`     | —                                       | Explorer-Container mit Toolbar, SearchBar, FilterPanel, FileTree     |
| `FileTree.tsx`          | —                                       | Rekursive Baumdarstellung, React.memo-optimiert                      |
| `FilterPanel.tsx`       | —                                       | Suchfeld, Kategorie, Score-Range, Hygiene-Status, Tags, Favoriten    |
| `SearchBar.tsx`         | —                                       | Text-Suche mit Debounce                                              |
| `TreeNode.tsx`          | —                                       | Einzelner Baumknoten (Datei/Ordner) mit Score-Badge, Favoriten-Stern |
| **Details**             | `components/details/DetailsPanel.tsx`   | Mittlere Spalte: Metadaten, Inhalt, Aktionen                         |
| **Analysis**            | `components/analysis/AnalysisPanel.tsx` | Rechte Spalte: Qualitäts- und Hygieneergebnisse                      |
| **Common**              | `components/common/`                    | Wiederverwendbare UI-Elemente                                        |
| `ExportDialog.tsx`      | —                                       | Export-Format-Dialog mit Progress-Bar                                |
| `ThemeToggle.tsx`       | —                                       | Dark-Mode-Umschalter                                                 |
| **Blueprints**          | `components/blueprints/`                | **In Entwicklung:** Blueprint-Analyse-UI                             |
| `BlueprintAnalysis.tsx` | —                                       | Blueprint-Qualitätsergebnisse                                        |
| `BlueprintDetails.tsx`  | —                                       | Blueprint-Detailansicht                                              |
| `BlueprintExplorer.tsx` | —                                       | Blueprint-Explorer                                                   |
| `BlueprintView.tsx`     | —                                       | Blueprint-Übersichtskomponente                                       |

## `src-tauri/` — Backend (Rust + Tauri 2)

| Pfad              | Zweck                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `Cargo.toml`      | Rust-Projektdefinition: Dependencies (tauri, serde, rusqlite, walkdir, notify, zip, regex, chrono, uuid) |
| `tauri.conf.json` | Tauri-Konfiguration (App-Name, Identifier, Window, Plugins, Capabilities)                                |
| `build.rs`        | Tauri-Build-Script                                                                                       |
| `src/main.rs`     | Einstiegspunkt (ruft `promptvault_lite_lib::run()` auf)                                                  |
| `src/lib.rs`      | Bibliotheks-Einstieg: Moduldeklaration, Tauri-Builder-Setup, Database-Initialisierung                    |

### `src-tauri/src/`

| Modul                  | Pfad        | Zweck                                                   |
| ---------------------- | ----------- | ------------------------------------------------------- |
| **analysis/**          | `analysis/` | Analyselogik                                            |
| `mod.rs`               | —           | Modul-Wurzel                                            |
| `quality.rs`           | —           | Qualitätsanalyse: 10 gewichtete Kriterien, Score 0–100  |
| `hygiene.rs`           | —           | Hygieneanalyse: 12 Artefakt-Kategorien, Score + Status  |
| `artifacts.rs`         | —           | Artefakt-Erkennungslogik (PII, Secrets, Logs, etc.)     |
| `recommendations.rs`   | —           | Empfehlungsgenerierung basierend auf Analyseergebnissen |
| `blueprint_quality.rs` | —           | **In Entwicklung:** Blueprint-Qualitätsanalyse          |
| **commands/**          | `commands/` | Tauri-Command-Handler                                   |
| `mod.rs`               | —           | Modul-Wurzel + `AppState`                               |
| `scan.rs`              | —           | `scan_directory`-Command                                |
| `analyze.rs`           | —           | `evaluate_prompt`, `analyze_hygiene`, `analyze_all`     |
| `favorites.rs`         | —           | `toggle_favorite`, `get_favorites`                      |
| `export.rs`            | —           | `export_json`, `export_markdown`, `export_zip`          |
| `persistence.rs`       | —           | Persistenz-Commands                                     |
| `blueprint.rs`         | —           | **In Entwicklung:** Blueprint-Commands                  |
| **database/**          | `database/` | Datenbank-Layer                                         |
| `mod.rs`               | —           | Modul-Wurzel                                            |
| `sqlite.rs`            | —           | SQLite-Implementierung (Tabelle, CRUD, Mutex)           |
| `cache.rs`             | —           | JSON-Cache-Fallback                                     |
| **models/**            | `models/`   | Datenmodelle                                            |
| `mod.rs`               | —           | Modul-Wurzel                                            |
| `prompt.rs`            | —           | Prompt-Datenstruktur                                    |
| `evaluation.rs`        | —           | Evaluations-Datenstruktur                               |
| `hygiene.rs`           | —           | Hygiene-Datenstruktur                                   |
| `artifact.rs`          | —           | Artefakt-Datenstruktur                                  |
| `blueprint.rs`         | —           | **In Entwicklung:** Blueprint-Datenmodell               |
| **parser/**            | `parser/`   | Markdown/Frontmatter-Parser                             |
| `mod.rs`               | —           | Modul-Wurzel                                            |
| `frontmatter.rs`       | —           | YAML-Frontmatter-Parsing mit Fallbacks                  |
| `markdown.rs`          | —           | Markdown-Strukturanalyse (Überschriften, Code-Blöcke)   |
| **scanner/**           | `scanner/`  | Dateiscanner                                            |
| `mod.rs`               | —           | Modul-Wurzel                                            |
| `file_scanner.rs`      | —           | Rekursiver Directory-Scan (walkdir, max 50 Ebenen)      |
| `watcher.rs`           | —           | File-Watcher (notify, 500ms Debounce)                   |
| `blueprint_scanner.rs` | —           | **In Entwicklung:** Blueprint-Datei-Scanner             |

### `src-tauri/tests/`

| Pfad                | Zweck                                                  |
| ------------------- | ------------------------------------------------------ |
| `command_errors.rs` | Integrationstests für Fehlerfälle aller Tauri-Commands |

## `docs/` — Dokumentation

```
docs/
├── README.md               # Projektübersicht
├── index.md                # MkDocs-Landing-Page (Diátaxis)
├── INSTALL.md              # Installationsanleitung
├── ARCHITECTURE.md         # Detail-Architektur
├── USER_GUIDE.md           # Benutzerhandbuch
├── TESTING.md              # Test-Anleitung
├── CHANGELOG.md            # Versionshistorie
├── SECURITY_GATES.md       # Sicherheitsregeln
├── glossary.md             # Projekt-Glossar
├── AI_HANDBUCH.md          # KI-Governance-Handbuch
├── AI_WORKFLOW.md          # KI-Workflow-Definition
├── EVIDENCE_STANDARD.md    # Evidence-Format-Standard
├── CONTEXT_ENGINEERING_STANDARD.md
├── GITHUB_REPOSITORY_SETTINGS_CHECKLIST.md
├── getting-started/        # Tutorials / Einstieg
├── how-to/                 # How-to-Guides
├── reference/              # Technische Referenz
├── explanation/            # Hintergrunderklärungen
├── architecture/           # Architektur-Überblick
├── runbooks/               # Entwicklungs-Runbooks
├── agent/                  # Agenten-Templates und Logs
│   ├── CONTEXT_MANIFEST_TEMPLATE.md
│   ├── CONTEXT_MANIFEST_TEMPLATE_V2.md
│   ├── EVIDENCE_LOG_TEMPLATE.md
│   ├── REVIEWER_CHECKLIST.md
│   ├── VERIFICATION_CONTRACT_TEMPLATE.md
│   └── AGENTS_DOCS_ADDENDUM.md
└── adr/                    # Architecture Decision Records
    ├── ADR-001-ai-governance.md
    └── ADR-002-docs-as-code-platform.md
```

## `.github/` — GitHub-Konfiguration

| Pfad                                | Zweck                                                            |
| ----------------------------------- | ---------------------------------------------------------------- |
| `CODEOWNERS`                        | Code-Review-Verantwortlichkeiten                                 |
| `copilot-instructions.md`           | GitHub Copilot-Projektanweisungen                                |
| `pull_request_template.md`          | PR-Template mit Governance-Checkliste                            |
| `ISSUE_TEMPLATE/`                   | Issue-Templates                                                  |
| `workflows/ci.yml`                  | CI-Workflow (Typecheck, Lint, Frontend-Tests, Rust-Tests, Build) |
| `workflows/ai-governance-check.yml` | KI-Governance-Check-Workflow                                     |

## `.opencode/` — OpenCode-Konfiguration

| Pfad                            | Zweck                          |
| ------------------------------- | ------------------------------ |
| `policies/evidence-gates.json`  | Evidence-Pflichten für Agenten |
| `policies/mcp-trust-tiers.json` | MCP-Tool-Trust-Tiers           |
| `policies/data-retention.json`  | DSGVO-Datenaufbewahrung        |
| `spec/`                         | Projektspezifikationen         |
| `specs/`                        | Weitere Spezifikationen        |
| `logs/`                         | Agenten-Logs                   |
| `.project-only/`                | OpenCode-Projekt-Metadaten     |
