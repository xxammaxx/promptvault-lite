# Speckit Constitution — PromptVault Lite Phase 3

## Phase: Performance & Plattform-Härtung (v1.3.0)

## Ausgangslage

Commit `4243434` (v1.2.0) — 88 Rust-Tests, 51 Frontend-Tests, alle grün.
Review-Agent identifizierte drei Problembereiche.

## Project Principles (unverändert aus Phase 2)

1. **GitHub Source of Truth:** Jede Änderung ist an ein Issue gebunden.
2. **Spec-Driven:** Kein Code vor abgeschlossener Spezifikation mit Akzeptanzkriterien.
3. **Test-First:** Tests werden vor/nach der Implementierung geschrieben.
4. **Modulstruktur unantastbar:** Bestehende Modulhierarchie bleibt erhalten.
5. **Keine TODOs:** Finaler Code enthält keine Platzhalter.

## Non-Negotiable Rules (Phase 3)

| Regel | Beschreibung                                              |
| ----- | --------------------------------------------------------- |
| R1    | `cargo clippy` muss 0 Warnings haben                      |
| R2    | `cargo fmt` vor jedem Commit                              |
| R3    | `cargo test` — alle Tests grün                            |
| R4    | `tsc --noEmit` ohne Fehler                                |
| R5    | Keine `any`-Typen in TypeScript                           |
| R6    | `pnpm test` — alle Frontend-Tests grün                    |
| R7    | `fileTree()` wird genau 1x pro Render aufgerufen          |
| R8    | `siblings.find()` ersetzt durch O(1)-Lookup               |
| R9    | Keine Panics in Produktionscode                           |
| R10   | Plattform-Pfade (Windows-Backslash, UNC) korrekt getestet |

## Feature Priority Queue

| Priority | Feature                           | Module                                                           | Typ      |
| -------- | --------------------------------- | ---------------------------------------------------------------- | -------- |
| P0       | File-Tree Performance-Optimierung | `src/stores/appStore.ts`, `src/components/explorer/FileTree.tsx` | Frontend |
| P1       | Clippy-Warnings bereinigen        | `src-tauri/src/` (alle Module)                                   | Backend  |
| P2       | Plattform-Pfad-Tests              | `src-tauri/src/scanner/file_scanner.rs`                          | Backend  |

## Definition of Done (Phase 3)

- [ ] `fileTree()` nutzt `Map<string, FileTreeNode>` für O(1)-Lookup
- [ ] `FileTree.tsx` ruft `fileTree()` nur 1x pro Render auf
- [ ] `useMemo` wrapping für `fileTree()` Ergebnis
- [ ] 0 Clippy-Warnings (`cargo clippy -- -W clippy::all`)
- [ ] `PromptItem::new()` auf max. 7 Parameter reduziert (oder Builder-Pattern)
- [ ] `AppState` und `DebouncedWatcher` implementieren `Default`
- [ ] `type_complexity` in `cache.rs` durch Type-Alias aufgelöst
- [ ] Min. 4 neue Plattform-Pfad-Tests (Windows-Backslash, UNC, Drive-Letter, Traversal)
- [ ] Alle 88+ Rust-Tests grün
- [ ] Alle 51+ Frontend-Tests grün
- [ ] CHANGELOG auf v1.3.0 aktualisiert
