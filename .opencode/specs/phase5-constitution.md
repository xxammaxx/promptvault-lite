# Speckit Constitution — PromptVault Lite Phase 5

## Phase: Feature Completion & Developer Experience (v1.5.0)

## Ausgangslage

Commit `6e5de57` (v1.4.0) — Phase 4 Security-Härtung & DX abgeschlossen.
109 Rust-Tests, 84 Frontend-Tests, 0 Clippy-Warnings, 0 ESLint-Fehler.

Phase-4-Testing (T4.8) dokumentierte zwei Lücken:

1. `filteredPrompts()` wertet `evaluations` nicht für Score-Filter aus (appStore.test.ts L441)
2. `toggle_favorite`/`get_favorites` sind Stubs → `Err("Nicht implementiert")` / `Ok(Vec::new())`

Die Datenbank-Infrastruktur unterstützt Favoriten bereits:

- `prompts.is_favorite`-Spalte (INTEGER, SQLite)
- `Database::set_favorite(prompt_id, is_favorite)`-Methode
- `save_prompts()`-UPSERT erhält `is_favorite` via COALESCE
- FTS-Index auf `prompts(is_favorite)`

Es fehlen nur: Commands-Logik, Store-Integration und UI.

## Project Principles (unverändert aus Phase 4)

1. **GitHub Source of Truth:** Jede Änderung ist an ein Issue gebunden.
2. **Spec-Driven:** Kein Code vor abgeschlossener Spezifikation mit Akzeptanzkriterien.
3. **Test-First:** Tests werden vor/nach der Implementierung geschrieben.
4. **Modulstruktur unantastbar:** Bestehende Modulhierarchie bleibt erhalten.
5. **Keine TODOs:** Finaler Code enthält keine Platzhalter.

## Non-Negotiable Rules (Phase 5)

| Regel | Beschreibung                                                                                 |
| ----- | -------------------------------------------------------------------------------------------- |
| R1    | `filteredPrompts()` liest `evaluations[p.id]?.overall_score` für Score-Filter                |
| R2    | Prompt ohne Evaluation → Score = 0 (wird mitgefiltert, wenn minScore = 0)                    |
| R3    | `toggle_favorite` verwendet `Database::set_favorite()` zur Persistenz                        |
| R4    | `toggle_favorite` benötigt Zugriff auf die Datenbank (AppState-Erweiterung oder Tauri State) |
| R5    | `get_favorites` returned nur IDs mit `is_favorite = true`                                    |
| R6    | UI-Favoriten-Button ist keyboard-accessible (Tab, Enter/Space)                               |
| R7    | `aria-label` für Favoriten-Button ("Als Favorit markieren" / "Favorit entfernen")            |
| R8    | FileTree zeigt ★-Indikator für favorisierte Einträge                                         |
| R9    | `cargo test` und `pnpm test` müssen grün sein                                                |
| R10   | 0 Clippy-Warnings, 0 ESLint-Fehler                                                           |
| R11   | CHANGELOG auf v1.5.0 aktualisiert                                                            |
| R12   | Keine Breaking Changes an bestehenden APIs                                                   |

## Feature Priority Queue

| Priority | Feature                             | Module                                   | Typ      |
| -------- | ----------------------------------- | ---------------------------------------- | -------- |
| P1       | Favoriten-Backend                   | `src-tauri/src/commands/favorites.rs`    | Backend  |
| P2       | Favoriten-UI                        | `src/components/detail/PromptDetail.tsx` | Frontend |
| P2       | Score-Filter in `filteredPrompts()` | `src/stores/appStore.ts`                 | Frontend |

## Architekturentscheidungen

### ADR-005: Favoriten-Persistenz via SQLite (nicht JSON-Cache)

**Entscheidung:** `toggle_favorite` nutzt direkt `Database::set_favorite()`.
**Begründung:**

- SQLite-Schema hat bereits `is_favorite INTEGER NOT NULL DEFAULT 0`
- `Database::set_favorite()` ist bereits implementiert und getestet (sqlite.rs L266–274, Test L563–575)
- `save_prompts()`-UPSERT erhält bestehenden Favoriten-Status via `COALESCE` (sqlite.rs L154)
- JSON-Cache müsste für Favoriten erweitert werden → zusätzliche Komplexität
- SQLite ist der primäre Persistenz-Layer (ARCHITECTURE.md L80)

### ADR-006: Datenbank-Zugriff für toggle_favorite

**Entscheidung:** `AppState` wird um `Database`-Feld erweitert.
**Alternativen:**

- A) `tauri::State<'_, Database>` in `toggle_favorite` — benötigt `manage()` in `lib.rs`
- B) `database::Database` in `AppState` integrieren — konsistent mit existierendem Muster
  **Entscheidung für A:** Trennung von Concerns. `AppState` bleibt Scan/Watcher-State.
  `Database` wird als separates Tauri-Managed-Objekt registriert.
  **Tradeoff:** Zwei State-Parameter in `toggle_favorite` statt einem.

### ADR-007: Score-Filter ohne Backend-Änderung

**Entscheidung:** Score-Filter bleibt reines Frontend-Feature.
**Begründung:** `evaluations` sind bereits im Store als `Record<string, PromptEvaluation>`.
`filteredPrompts()` ist ein zustand-Derivation — kein Tauri-Command nötig.
Kein zusätzlicher Backend-Code erforderlich.

## Definition of Done (Phase 5)

- [ ] `toggle_favorite(prompt_id)` toggled via `Database::set_favorite()` und returned neuen Status
- [ ] `get_favorites()` returned `Vec<String>` mit favorisierten IDs
- [ ] `test_toggle_favorite_not_implemented`-Test in `command_errors.rs` aktualisiert
- [ ] Neue Integrationstests: toggle favorisiert, toggle entfavorisiert, get_favorites leer/voll, toggle unbekannte ID
- [ ] `filteredPrompts()` filtert nach `minScore`/`maxScore` aus `evaluations`
- [ ] Prompt ohne Evaluation → Score 0 (kein Ausschluss durch Default-Range 0–100)
- [ ] Score-Filter-Tests: minScore, maxScore, Kombination mit anderen Filtern, Edge Cases
- [ ] Favoriten-Button in PromptDetail.tsx: ☆/★-Toggle
- [ ] FileTree integriert ★-Indikator für `is_favorite`
- [ ] `filteredPrompts()` prüft `filters.favoritesOnly` (existiert bereits) gegen tatsächliche Favoriten
- [ ] `cargo test` — alle 109+ Tests grün (+ mindestens 6 neue Rust-Tests)
- [ ] `pnpm test` — alle 84+ Tests grün (+ mindestens 8 neue Frontend-Tests)
- [ ] `cargo clippy` — 0 Warnings
- [ ] `tsc --noEmit` / ESLint — 0 Errors
- [ ] CHANGELOG auf v1.5.0 aktualisiert
