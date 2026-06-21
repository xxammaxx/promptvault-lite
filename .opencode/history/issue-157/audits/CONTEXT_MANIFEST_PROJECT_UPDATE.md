# Context Manifest — Project Content Update

## Session

- **Session ID:** project-content-update-2026-06-09
- **Issue:** N/A (meta-task: project documentation consolidation)
- **Branch:** feat/darkmode
- **Commit:** 9d5c445
- **Started at:** 2026-06-09T15:00:00+02:00

## Ziel der Änderung

Projektinhalt, Dokumentation, Roadmap und Architekturhinweise auf Basis aller lokal im Projekt vorhandenen Informationen aktualisieren. Keine erfundenen Informationen. Alle Aussagen belegbar aus lokalen Projektdateien.

## Geladene Dateien (Cold Context)

| Datei                                     | Grund                                     |
| ----------------------------------------- | ----------------------------------------- |
| `AGENTS.md`                               | Agentenregeln, Workflow, Hard Constraints |
| `CLAUDE.md`                               | Kompakte Agentenreferenz                  |
| `docs/SECURITY_GATES.md`                  | Sicherheitsregeln für Agenten             |
| `docs/AI_HANDBUCH.md`                     | Governance-Standard                       |
| `docs/AI_WORKFLOW.md`                     | Workflow-Phasen                           |
| `.opencode/policies/evidence-gates.json`  | Evidence-Anforderungen                    |
| `.opencode/policies/mcp-trust-tiers.json` | MCP-Tool-Tiers                            |
| `.opencode/policies/data-retention.json`  | Datenaufbewahrung                         |

## Geladene Dateien (Warm Context)

| Datei                                          | Grund                            |
| ---------------------------------------------- | -------------------------------- |
| `README.md`                                    | Zentrale Projektdokumentation    |
| `Prompt.md`                                    | Ursprüngliche Spezifikation      |
| `package.json`                                 | Version, Skripte, Abhängigkeiten |
| `src-tauri/Cargo.toml`                         | Rust-Version, Abhängigkeiten     |
| `src-tauri/tauri.conf.json`                    | Tauri-Konfiguration, Version     |
| `docs/ARCHITECTURE.md`                         | Systemarchitektur                |
| `docs/CHANGELOG.md`                            | Versionshistorie                 |
| `docs/USER_GUIDE.md`                           | Benutzerhandbuch                 |
| `docs/TESTING.md`                              | Teststruktur                     |
| `docs/INSTALL.md`                              | Installationsanleitung           |
| `docs/README.md`                               | Docs-Übersicht                   |
| `docs/EVIDENCE_STANDARD.md`                    | Evidence-Format                  |
| `docs/CONTEXT_ENGINEERING_STANDARD.md`         | Kontext-Management               |
| `docs/GITHUB_REPOSITORY_SETTINGS_CHECKLIST.md` | GitHub-Einstellungen             |
| `docs/adr/ADR-001-ai-governance.md`            | Architekturentscheidung          |
| `.github/workflows/ci.yml`                     | CI-Konfiguration                 |
| `.github/workflows/ai-governance-check.yml`    | Governance-Check                 |
| `.github/CODEOWNERS`                           | Code-Owner-Zuweisung             |
| `.github/copilot-instructions.md`              | Copilot-Projektkontext           |
| `.github/pull_request_template.md`             | PR-Template                      |
| `.github/ISSUE_TEMPLATE/`                      | Issue-Templates                  |
| `.opencode/spec/`                              | Spezifikationen                  |
| `.opencode/specs/`                             | Phase-Spezifikationen            |
| `.gitignore`                                   | Git-Ausschlussregeln             |

## Geladene Dateien (Hot Context — Quellcode-Verifikation)

| Datei                     | Grund                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `src-tauri/src/analysis/` | Analyse-Module verifiziert (artifacts, hygiene, quality, recommendations, blueprint_quality\*) |
| `src-tauri/src/commands/` | Tauri-Commands verifiziert (analyze, export, favorites, persistence, scan, blueprint\*)        |
| `src-tauri/src/scanner/`  | Scanner-Module verifiziert (file_scanner, watcher, blueprint_scanner\*)                        |
| `src-tauri/src/models/`   | Datenmodelle verifiziert (artifact, evaluation, hygiene, prompt, blueprint\*)                  |
| `src/components/`         | Frontend-Komponenten (analysis, details, explorer, blueprints\*)                               |
| `src/stores/`             | Zustand-Stores (appStore, blueprintStore\*)                                                    |

_Mit _ markierte Dateien sind untracked/neu und nicht in veröffentlichten Versionen enthalten.

## Nicht geladene Bereiche

| Bereich                | Grund                                  |
| ---------------------- | -------------------------------------- |
| `node_modules/`        | Build-Artefakte, nicht Source of Truth |
| `dist/`                | Build-Artefakte                        |
| `.tmp/`                | Temporäre Dateien/Worktrees            |
| `target/`              | Rust-Build-Artefakte                   |
| `scripts/__pycache__/` | Python-Cache                           |
| `tests/__pycache__/`   | Python-Cache                           |

## Source of Truth

| Quelle                  | Status                                               |
| ----------------------- | ---------------------------------------------------- |
| GitHub Issues           | Lokal nicht verfügbar (kein Network-Call)            |
| README.md               | Gelesen — Basis der Projektdokumentation             |
| docs/                   | Gelesen — vollständige Dokumentationssammlung        |
| Code (src/, src-tauri/) | Gelesen — Struktur und Module verifiziert            |
| Tests                   | Existieren (94 Frontend, 113 Rust), nicht ausgeführt |
| ADRs                    | ADR-001 vorhanden                                    |
| .opencode/spec/         | Speckit-Spezifikationen vorhanden                    |

## Annahmen

1. Die Code-Module entsprechen den in README.md und ARCHITECTURE.md beschriebenen Funktionen (Annahme — basierend auf Dateinamen und Struktur, keine tiefe Code-Analyse).
2. Die Testanzahlen aus README.md (94 Frontend, 113 Rust) sind korrekt (Annahme — nicht selbst ausgeführt).
3. Die Blueprint-Feature-Dateien sind in Entwicklung und nicht Teil von v1.5.0 (Tatsache — untracked files).
4. CI-Status der Workflows ist unbekannt (Annahme — lokal nicht verifizierbar).

## Unsichere Punkte

1. **Versionsdrift-Behauptung in README.md** („package.json und Cargo.toml nennen noch 1.4.0") — gelesene Dateien zeigen beide 1.5.0. Behauptung scheint veraltet/behoben.
2. **Testanzahl-Differenz**: CHANGELOG v1.5.0 nennt 93 Frontend-Tests, README nennt 94. Welche Zahl korrekt ist, kann nur durch Testausführung bestätigt werden.
3. **Kein CONTRIBUTING.md** gefunden — README enthält Contributing-Sektion.
4. **docs/ARCHITECTURE.md** Frontmatter-Version 1.0.0 — möglicherweise veraltet.

## Token-Budget-Schätzung

- Geladene Dateien: ~35
- Geschätzte Tokens: ~25,000 (Cold + Warm Context)
- Code-Struktur: ~3,000 (Verzeichnislistings)
- Noch verfügbar: ausreichend
