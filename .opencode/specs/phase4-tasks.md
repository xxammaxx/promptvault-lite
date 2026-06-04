# PromptVault Lite Phase 4 — Task Breakdown

## Version: 1.4.0

---

## T4.1 — Symlink-Containment implementieren [2h] 🟡 P2

**Depends on:** Keine (erster Task)
**Module:** `src-tauri/src/scanner/file_scanner.rs`

- [ ] `canonicalize()` auf `dir_path` (Root) anwenden nach Existenz-Prüfung
- [ ] `canonical_root` als `PathBuf` speichern für Containment-Checks
- [ ] Für jede gescannte Datei (vor `fs::read_to_string`): `canonicalize()` auf `entry.path()`
- [ ] Containment-Check: Nur wenn `canonical_file.starts_with(&canonical_root)` → akzeptieren
- [ ] Externe Symlinks loggen: `log::warn!("Symlink außerhalb des Vaults übersprungen: {}")`
- [ ] `symlink_depth()`-Prüfung erfolgt **vor** Containment-Check (Performance)
- [ ] Bestehende 7 Scanner-Tests validieren → alle grün
- [ ] `cargo test --lib scanner` → grün

**Akzeptanz:** Alle 7 existierenden Scanner-Tests grün, Code kompiliert ohne Warnings.

---

## T4.2 — Symlink-Containment-Tests [1.5h] 🟡 P2

**Depends on:** T4.1
**Module:** `src-tauri/src/scanner/file_scanner.rs` (Tests)

- [ ] `test_symlink_outside_vault_not_scanned()`:
  - TempDir A (Vault), TempDir B (außerhalb mit `secret.md`)
  - Symlink in A → B
  - `scan_directory(vault_path)` → `secret.md` ist **nicht** im Ergebnis
- [ ] `test_symlink_inside_vault_is_scanned()`:
  - TempDir mit Sub-Ordner, Symlink innerhalb des Vaults zu `.md`-Datei
  - `scan_directory()` → Symlink-Datei wird gescannt (legitimer interner Symlink)
- [ ] `test_symlink_loop_detected()`:
  - Symlink-Zyklus A→B→A innerhalb Vault
  - `scan_directory()` → kein unendlicher Loop, kein Stack-Overflow, Warn-Log
- [ ] `cargo test --lib scanner` → alle 10+ Tests grün (7 alt + 3 neu)

**Akzeptanz:** 3 neue Tests grün, CVSS 2.8 Finding adressiert.

---

## T4.3 — TreeNode: isExpanded/isSelected aus Store [1.5h] 🟡 P3

**Depends on:** Keine (unabhängig von T4.1)
**Module:** `src/components/explorer/TreeNode.tsx`

- [ ] Kind-`TreeNode` verwendet eigenen Zustand via `useAppStore`:
  - `isExpanded`: `useAppStore(s => s.expandedFolders.has(node.path))`
  - `isSelected`: `useAppStore(s => s.selectedPromptId === node.prompt_id)`
- [ ] Eltern-Prop-Weitergabe in Zeile 44/45 entfernen:
  - Alt: `<TreeNode ... isExpanded={isExpanded} isSelected={isSelected} />`
  - Neu: `<TreeNode key={child.path} node={child} depth={depth + 1} onToggle={onToggle} onSelect={onSelect} />`
- [ ] `TreeNodeProps`-Interface anpassen: `isExpanded` ↔ `isSelected` werden optional (nur für Root-Knoten)
- [ ] Alle 14 existierenden `TreeNode.test.tsx` Tests validieren → grün
- [ ] `pnpm test -- TreeNode` → alle grün

**Akzeptanz:** Kind-`TreeNode` rendert nur bei eigenen State-Änderungen, bestehende Tests grün.

---

## T4.4 — TreeNode: React.memo aktivieren [1h] 🟡 P3

**Depends on:** T4.3
**Module:** `src/components/explorer/TreeNode.tsx`

- [ ] `TreeNode` mit `React.memo` wrappen
- [ ] Custom-Comparator definieren:
  ```typescript
  const arePropsEqual = (prev: TreeNodeProps, next: TreeNodeProps): boolean =>
    prev.node === next.node &&
    prev.depth === next.depth &&
    prev.isExpanded === next.isExpanded &&
    prev.isSelected === next.isSelected &&
    prev.onToggle === next.onToggle &&
    prev.onSelect === next.onSelect;
  ```
- [ ] `onToggle` und `onSelect` in `FileTree.tsx` mit `useCallback` stabilisieren
- [ ] `pnpm test -- TreeNode` → alle 14 Tests grün
- [ ] React DevTools Profiler: Expand eines Ordners mit 100 Kind-Dateien → Kindknoten rendern nicht

**Akzeptanz:** Memoizing aktiv, keine unnötigen Re-Renders von Kindknoten.

---

## T4.5 — Pfad-Sanitization: ".." und "." filtern [1h] 🟡 P3

**Depends on:** Keine (unabhängig)
**Module:** `src/stores/appStore.ts` (`fileTree()` Methode, Zeile 222-226)

- [ ] In der `parts`-Berechnung: `.filter(part => part !== ".." && part !== ".")` hinzufügen
- [ ] Geänderte Zeile:
  ```typescript
  const parts = prompt.file_path
    .replace(/\\/g, "/")
    .split("/")
    .filter((p) => p !== ".." && p !== ".") // NEU
    .filter(Boolean);
  ```
- [ ] Pfade die nach Sanitization leer sind → `continue` (Prompt nicht in Tree aufnehmen)
- [ ] Warn-Log für leer-sanitized Pfade
- [ ] `FileTree.test.tsx` AC-3 anpassen: Test ändert sich von "stellt .. als Knoten dar" zu "filtert .. aus"
- [ ] `pnpm test -- FileTree` → alle Tests grün (inkl. angepasstem AC-3)

**Akzeptanz:** `".."` und `"."` Segmente erscheinen nicht mehr als Tree-Knoten.

---

## T4.6 — Pfad-Sanitization: Absolute Pfade relativieren [45m] 🟡 P3

**Depends on:** T4.5
**Module:** `src/stores/appStore.ts` (`fileTree()` Methode)

- [ ] Vault-Root aus `currentFolderPath` im Store lesen
- [ ] Absolute Pfade relativ zum Root darstellen: Pfad-Präfix entfernen
- [ ] Fallback: Wenn `currentFolderPath` `null` ist, Pfad unverändert lassen
- [ ] Nur anwenden wenn Pfad mit Root-Präfix beginnt (nicht für Windows Drive-Letter)
- [ ] Test: Absoluter Pfad `/home/user/vault/test.md` mit Root `/home/user/vault` → zeigt `test.md`
- [ ] `pnpm test -- FileTree` → alle Tests grün

**Akzeptanz:** Absolute Pfade im Tree relativ zum Vault-Root angezeigt.

---

## T4.7 — Store-Unit-Tests: fileTree() [2h] 🟢 P2

**Depends on:** T4.5, T4.6 (testet Sanitization mit)
**Module:** `src/stores/__tests__/appStore.test.ts` (NEU)

- [ ] `describe("fileTree")` Test-Suite
- [ ] `it("gibt leeren Tree bei leeren Prompts")` → `[]`
- [ ] `it("erzeugt flachen Tree bei Prompts ohne Pfad-Hierarchie")` → 1 Ordner, Dateien
- [ ] `it("bildet verschachtelte Pfade korrekt ab")` → `folder/sub/prompt.md`
- [ ] `it("ordnet Scores aus evaluations zu")` → `evaluations[id].overall_score` erscheint
- [ ] `it("ordnet is_favorite aus Prompt-Daten zu")` → Favoriten-Stern-Indikator
- [ ] `it("filtert ..-Segmente aus")` → `vault/../test.md` → `vault/test.md`
- [ ] `it("filtert .-Segmente aus")` → `vault/./test.md` → `vault/test.md`
- [ ] `it("ignoriert Pfade die nach Sanitization leer sind")` → nur `../..` → nicht im Tree
- [ ] `it("sortiert Ordner vor Dateien, alphabetisch")` → Dir first, then by name
- [ ] `pnpm test -- appStore` → alle grün

**Akzeptanz:** 10 fileTree-Tests grün, Coverage >90% für `fileTree()`.

---

## T4.8 — Store-Unit-Tests: filteredPrompts() [1.5h] 🟢 P2

**Depends on:** Keine (testet existierende `filteredPrompts()`)
**Module:** `src/stores/__tests__/appStore.test.ts` (NEU, ergänzen)

- [ ] `describe("filteredPrompts")` Test-Suite
- [ ] `it("gibt leere Liste bei keinen Prompts")` → `[]`
- [ ] `it("gibt alle Prompts zurück wenn alle Filter deaktiviert")` → `prompts.length` matches
- [ ] `it("filtert nach search (Titel)")` → case-insensitive match
- [ ] `it("filtert nach search (Kategorie, Tags, Content)")` → multi-field search
- [ ] `it("filtert favoritesOnly")` → nur `is_favorite: true`
- [ ] `it("filtert nach category")` → exakte Kategorie-Matches
- [ ] `it("filtert nach tags (multi-select)")` → mindestens ein Tag muss matchen
- [ ] `it("filtert nach minScore/maxScore")` → Evaluations-basierter Filter
- [ ] `it("filtert nach hygieneStatus")` → Hygiene-basierter Filter
- [ ] `it("kombiniert mehrere Filter (UND)")` → favoritesOnly + category + search
- [ ] `pnpm test -- appStore` → alle grün

**Akzeptanz:** 11 filteredPrompts-Tests grün, Coverage >90% für `filteredPrompts()`.

---

## T4.9 — Command-Fehlerfall-Tests: scan + analyze [1.5h] 🟢 P2

**Depends on:** T4.1, T4.2
**Module:** `src-tauri/tests/command_errors.rs` (NEU)

- [ ] `test_scan_nonexistent_path` → `Err("Verzeichnis existiert nicht: ...")`
- [ ] `test_scan_path_is_file_not_directory` → `Err("Pfad ist kein Verzeichnis: ...")`
- [ ] `test_scan_empty_string` → `Err` (dokumentiertes Verhalten)
- [ ] `test_evaluate_prompt_unknown_id` → logische Prüfung (Error-Handling existiert?)
- [ ] `test_analyze_hygiene_unknown_id` → logische Prüfung
- [ ] `test_analyze_all_empty_prompts` → Logik-Test ohne full Tauri Boot
- [ ] `cargo test --test command_errors` → grün

**Akzeptanz:** 6 Rust-Fehlerfall-Tests grün.

---

## T4.10 — Command-Fehlerfall-Tests: export + favorites [1h] 🟢 P2

**Depends on:** T4.9
**Module:** `src-tauri/tests/command_errors.rs` (ergänzen)

- [ ] `test_export_invalid_target_path` → Error-Handling prüfen
- [ ] `test_export_empty_prompt_list` → Leerer Export vs Error (dokumentieren)
- [ ] `test_toggle_favorite_unknown_id` → Error-Prüfung
- [ ] `test_get_favorites_empty_db` → `Ok([])`
- [ ] `cargo test --test command_errors` → grün

**Akzeptanz:** 4 weitere Rust-Fehlerfall-Tests grün.

---

## T4.11 — Command-Fehlerfall-Tests: persistence + watcher [45m] 🟢 P2

**Depends on:** T4.10
**Module:** `src-tauri/tests/command_errors.rs` (ergänzen)

- [ ] `test_load_cache_nonexistent_file` → `Err` oder `Ok([])` (dokumentieren)
- [ ] `test_save_cache_unwritable_path` → `Err`
- [ ] `test_start_watcher_invalid_path` → Error-Prüfung
- [ ] `test_stop_watcher_without_active` → `Ok` (idempotent)
- [ ] `cargo test --test command_errors` → alle 14 Tests grün

**Akzeptanz:** 4 weitere Rust-Fehlerfall-Tests grün, 14 Command-Tests total.

---

## T4.12 — ESLint Strict Mode konfigurieren [45m] 🔵 DX P2

**Depends on:** T4.1–T4.6 (alle Code-Änderungen müssen vorher stehen)
**Module:** `.eslintrc.json` (NEU), `package.json`

- [ ] `.eslintrc.json` erstellen mit `@typescript-eslint/strict-type-checked`
- [ ] `parserOptions.project: "./tsconfig.json"`
- [ ] Rules: `no-explicit-any: error`, `no-floating-promises: error`, `exhaustive-deps: error`
- [ ] `.eslintignore` für `node_modules`, `dist`, `src-tauri`
- [ ] `package.json` Scripts prüfen/aktualisieren
- [ ] `pnpm lint` ausführen → Fehler dokumentieren

**Akzeptanz:** ESLint-Konfiguration erstellt und funktionsfähig.

---

## T4.13 — ESLint-Fehler beheben [1.5h] 🔵 DX P2

**Depends on:** T4.12
**Module:** `src/` (verschiedene Dateien)

- [ ] `pnpm lint` ausführen, alle Fehler auflisten
- [ ] `any`-Typen durch `unknown` oder spezifische Typen ersetzen
- [ ] `no-floating-promises`: Alle Promises mit `void` oder `.catch()` versehen
- [ ] `react-hooks/exhaustive-deps`: Fehlende Dependencies in `useEffect`/`useCallback` ergänzen
- [ ] `pnpm lint` → 0 Errors, 0 Warnings
- [ ] `pnpm test` → alle Tests weiterhin grün

**Akzeptanz:** 0 ESLint-Fehler, 0 ESLint-Warnings, alle Tests grün.

---

## T4.14 — Pre-commit Hook erstellen [45m] 🔵 DX P2

**Depends on:** T4.13 (ESLint muss grün sein)
**Module:** `.git/hooks/pre-commit` (NEU)

- [ ] `.git/hooks/pre-commit` als Shell-Skript erstellen
- [ ] `chmod +x .git/hooks/pre-commit`
- [ ] Inhalt: `cargo fmt --check`, `cargo clippy -- -D warnings`, `tsc --noEmit`
- [ ] Mit `set -e` (scheitert bei erstem Fehler)
- [ ] Kommentar-Header mit Installations-/Deaktivierungs-Hinweis
- [ ] Test: `git commit --dry-run` triggert Hook (simuliert)

**Akzeptanz:** Pre-commit Hook existiert, ausführbar, blockiert fehlerhafte Commits.

---

## T4.15 — Quality Gate: Finaler Test-Lauf [30m] 🔵 DX P2

**Depends on:** T4.1–T4.14 (alle Tasks)
**Module:** Alle

- [ ] `cargo fmt --check` → 0 Änderungen
- [ ] `cargo clippy -- -D warnings` → 0 Warnings
- [ ] `cargo test` → alle Tests grün (88+ Bestand + neue ~14)
- [ ] `tsc --noEmit` → 0 Fehler
- [ ] `pnpm lint` → 0 Errors, 0 Warnings
- [ ] `pnpm test` → alle Tests grün (51+ Bestand + neue ~16)
- [ ] `CHANGELOG.md` auf v1.4.0 aktualisieren (delegieren an documentation-agent)

**Akzeptanz:** Quality Gate komplett grün, changelog aktuell.

---

## Zusammenfassung

| ID        | Task                                 | Abhängigkeiten | Zeit     | Typ         |
| --------- | ------------------------------------ | -------------- | -------- | ----------- |
| T4.1      | Symlink-Containment implementieren   | —              | 2h       | 🔴 Security |
| T4.2      | Symlink-Containment-Tests            | T4.1           | 1.5h     | 🔴 Security |
| T4.3      | TreeNode: Store-Selectors            | —              | 1.5h     | 🟡 Frontend |
| T4.4      | TreeNode: React.memo                 | T4.3           | 1h       | 🟡 Frontend |
| T4.5      | Pfad-Sanitization: .. und . filtern  | —              | 1h       | 🟡 Frontend |
| T4.6      | Pfad-Sanitization: Absolute Pfade    | T4.5           | 0.75h    | 🟡 Frontend |
| T4.7      | Store-Tests: fileTree()              | T4.5, T4.6     | 2h       | 🟢 Testing  |
| T4.8      | Store-Tests: filteredPrompts()       | —              | 1.5h     | 🟢 Testing  |
| T4.9      | Command-Tests: scan + analyze        | T4.1, T4.2     | 1.5h     | 🟢 Testing  |
| T4.10     | Command-Tests: export + favorites    | T4.9           | 1h       | 🟢 Testing  |
| T4.11     | Command-Tests: persistence + watcher | T4.10          | 0.75h    | 🟢 Testing  |
| T4.12     | ESLint Strict konfigurieren          | T4.1–T4.6      | 0.75h    | 🔵 DX       |
| T4.13     | ESLint-Fehler beheben                | T4.12          | 1.5h     | 🔵 DX       |
| T4.14     | Pre-commit Hook erstellen            | T4.13          | 0.75h    | 🔵 DX       |
| T4.15     | Quality Gate Final                   | Alle           | 0.5h     | 🔵 DX       |
| **Total** | **15 Tasks**                         |                | **~18h** |             |

### Definition of Done (jeder Task)

- [ ] Code implementiert und kompiliert
- [ ] Relevante Tests geschrieben und grün
- [ ] Keine TODO-Kommentare
- [ ] Keine ungenutzten Imports oder Dead Code
- [ ] `cargo clippy` ohne Warnings (Rust)
- [ ] ESLint ohne Errors (TypeScript)

### Task-Dependency-Matrix (vereinfacht)

```
T4.1 ──→ T4.2 ──┐
                  ├──→ T4.9 ──→ T4.10 ──→ T4.11 ──┐
T4.3 ──→ T4.4 ───┤                                │
                  │                                ├──→ T4.12 ──→ T4.13 ──→ T4.14 ──→ T4.15
T4.5 ──→ T4.6 ───┤                                │
                  ├──→ T4.7 ───────────────────────┘
T4.8 ─────────────┘   (unabhängig)
```
