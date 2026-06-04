# Speckit Constitution — PromptVault Lite Phase 2

## Project Principles

1. **GitHub Source of Truth:** Jede Änderung ist an ein Issue gebunden. Keine Implementierung ohne spezifiziertes Issue.
2. **Spec-Driven:** Kein Code vor abgeschlossener Spezifikation mit Akzeptanzkriterien.
3. **Test-First:** Tests werden vor/nach der Implementierung geschrieben. Bestehende 64 Rust-Tests dürfen nicht brechen.
4. **Modulstruktur unantastbar:** Die bestehende Modulhierarchie (`commands/`, `scanner/`, `analysis/`, `parser/`, `models/`, `database/`) bleibt erhalten.
5. **Keine TODOs:** Finaler Code enthält keine Platzhalter, Stubs oder TODO-Kommentare.

## Non-Negotiable Rules

| Regel | Beschreibung                                                   |
| ----- | -------------------------------------------------------------- |
| R1    | `cargo clippy` muss ohne Warnings durchlaufen                  |
| R2    | `cargo fmt` vor jedem Commit                                   |
| R3    | `cargo test` — alle 64+ Tests müssen grün sein                 |
| R4    | `tsc --noEmit` ohne Fehler                                     |
| R5    | Keine `any`-Typen in TypeScript                                |
| R6    | ESLint strict ohne Warnings                                    |
| R7    | Jedes Feature erhält eigene Tests (Unit + Integration)         |
| R8    | API-Commands erhalten Fehlerbehandlung mit `Result<T, String>` |
| R9    | Keine Panics in Produktionscode, nur `Result`-Propagation      |
| R10   | Tauri State wird über `tauri::State<'_, AppState>` verwaltet   |

## Feature Priority Queue

| Priority | Feature                    | Module                          | Dependencies                                     |
| -------- | -------------------------- | ------------------------------- | ------------------------------------------------ |
| P0       | Export (JSON/Markdown/ZIP) | `commands/export.rs` + Frontend | `models::PromptItem`, `analysis::*`, `parser::*` |
| P1       | File Watcher               | `scanner/watcher.rs`            | `notify` Crate, `commands/scan.rs`               |
| P1       | Native Icons               | `icons/` + `tauri.conf.json`    | `public/vault.svg`                               |
| P2       | Analyse-Edge-Case-Tests    | `src-tauri/src/analysis/`       | Bestehende Analyse-Logik                         |
| P2       | Frontend-Tests             | `src/components/`               | `vitest`, `@testing-library/react`               |
| P3       | Keyboard-Shortcuts         | `App.tsx` + Komponenten         | Tauri Webview Events                             |

## Version Target

Phase 2 → **v1.1.0** (CHANGELOG.md wird aktualisiert)
