# Speckit Constitution — PromptVault Lite Phase 4

## Phase: Security-Härtung & Developer Experience (v1.4.0)

## Ausgangslage

Commit `f36f97f` (v1.3.0) — Phase 3 Performance & Plattform-Härtung abgeschlossen.
Security-Agent und Review-Agent identifizierten in Phase 3 mehrere konsolidierungsbedürftige Bereiche.

## Project Principles (unverändert aus Phase 3)

1. **GitHub Source of Truth:** Jede Änderung ist an ein Issue gebunden.
2. **Spec-Driven:** Kein Code vor abgeschlossener Spezifikation mit Akzeptanzkriterien.
3. **Test-First:** Tests werden vor/nach der Implementierung geschrieben.
4. **Modulstruktur unantastbar:** Bestehende Modulhierarchie bleibt erhalten.
5. **Keine TODOs:** Finaler Code enthält keine Platzhalter.

## Non-Negotiable Rules (Phase 4)

| Regel | Beschreibung                                                             |
| ----- | ------------------------------------------------------------------------ |
| R1    | `canonicalize()` + Containment-Check vor jedem Datei-Scan                |
| R2    | Symlinks außerhalb des Vault-Roots werden **nicht** gescannt             |
| R3    | `TreeNode`-Kinder leiten `isExpanded`/`isSelected` aus Store ab          |
| R4    | `React.memo` mit Custom-Comparator für alle `TreeNode`-Instanzen         |
| R5    | `".."`-Segmente in `fileTree()` werden gefiltert, nicht als Knoten       |
| R6    | Absolute Pfade in `fileTree()` werden relativ zum Vault-Root dargestellt |
| R7    | Store-Unit-Tests: `fileTree()`, `filteredPrompts()` Pflicht              |
| R8    | Command-Level-Fehlerfall-Tests für alle Tauri Commands                   |
| R9    | `tsc --noEmit` muss 0 Fehler haben (ESLint strict mode)                  |
| R10   | Pre-commit: `cargo fmt --check`, `cargo clippy`, `tsc --noEmit`          |
| R11   | Bestehende 88+ Rust-Tests + 51+ Frontend-Tests bleiben grün              |
| R12   | Keine `any`-Typen in TypeScript (unverändert)                            |

## Feature Priority Queue

| Priority | Feature                  | Module                                         | Typ      |
| -------- | ------------------------ | ---------------------------------------------- | -------- |
| P2       | Symlink-Containment      | `src-tauri/src/scanner/file_scanner.rs`        | Security |
| P3       | TreeNode React.memo      | `src/components/explorer/TreeNode.tsx`         | Frontend |
| P3       | Pfad-Sanitization        | `src/stores/appStore.ts` (`fileTree()`)        | Frontend |
| P2       | Store-Unit-Tests         | `src/stores/__tests__/appStore.test.ts`        | Testing  |
| P2       | Command-Fehlerfall-Tests | `src-tauri/tests/` + `src-tauri/src/commands/` | Testing  |
| P2       | ESLint Strict Mode       | `.eslintrc.json` (neu), `src/`                 | DX       |
| P2       | Pre-commit Hooks         | `.git/hooks/pre-commit` (neu)                  | DX       |

## Definition of Done (Phase 4)

- [ ] `scan_directory()` akzeptiert nur Dateien mit kanonischem Pfad innerhalb des kanonischen Roots
- [ ] Symlink-Containment- und Symlink-Loop-Tests
- [ ] `TreeNode`-Kinder beziehen `isExpanded`/`isSelected` aus Store (nicht Eltern-Props)
- [ ] `React.memo` mit Custom-Comparator auf `TreeNode` aktiv
- [ ] `".."`-Segmente in `fileTree()` werden verworfen (nicht als Knoten sichtbar)
- [ ] Absolute Pfade in `fileTree()` relativ zum Vault-Root dargestellt
- [ ] `appStore.test.ts`: `fileTree()` und `filteredPrompts()` mit vollständiger Coverage
- [ ] Fehlerfall-Tests für alle Tauri Commands (scan, analyze, export, favorites, persistence, watcher)
- [ ] `.eslintrc.json` mit Strict-Mode-Config (`@typescript-eslint/strict-type-checked`)
- [ ] Pre-commit Hook: `cargo fmt --check && cargo clippy -- -D warnings && tsc --noEmit`
- [ ] 0 Clippy-Warnings, 0 ESLint-Fehler
- [ ] Alle neuen Tests grün (+ min. 15 neue Tests)
- [ ] CI validiert alle Hooks
- [ ] CHANGELOG auf v1.4.0 aktualisiert
