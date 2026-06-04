# PromptVault Lite Phase 4 — Formal Specification

## Version: 1.4.0 — Security-Härtung & Developer Experience

---

## S4.1 — Symlink-Containment (Issue #14)

### User Story

**Als** Sicherheits-Auditor
**möchte ich** dass Symlinks, die aus dem Vault-Root herauszeigen, nicht gescannt werden
**damit** keine externen `.md`-Dateien unbeabsichtigt in den App-State gelangen.

### Acceptance Criteria

#### AC-1: Canonical Root wird berechnet

- `scan_directory()` wendet `std::fs::canonicalize()` auf den übergebenen `dir_path` (Root) an
- Bei Fehler (z.B. nicht existent) wird der bestehende Error-Pfad verwendet
- Der kanonische Root wird für alle Containment-Checks verwendet

#### AC-2: Jede gescannte Datei wird auf Containment geprüft

- Vor dem Lesen einer Datei wird ihr kanonischer Pfad ermittelt
- Nur wenn `canonical_file.starts_with(canonical_root)` gilt, wird die Datei akzeptiert
- Symlinks, die aus dem Root herauszeigen, werden geloggt (Warn-Level) und übersprungen

#### AC-3: Symlink-Loop-Erkennung bleibt erhalten

- `symlink_depth()` prüft weiterhin auf Kettenlänge > 5
- Diese Prüfung läuft **vor** dem Containment-Check (Performance: kurze Zyklen früh verwerfen)

#### AC-4: existierende Tests bleiben grün

- `test_scan_empty_directory`, `test_scan_single_md_file`, `test_scan_with_frontmatter`, `test_scan_nested_directories`, `test_ignores_non_md_files`, `test_nonexistent_directory`, `test_missing_frontmatter_fallback` — alle unverändert grün

#### AC-5: Symlink-Containment-Test

- TempDir A (Vault) mit Symlink zu TempDir B (außerhalb → enthält `secret.md`)
- `scan_directory(vault_path)` darf `secret.md` **nicht** einscannen
- `follow_links(true)` bleibt aktiv (für legitime interne Symlinks)

#### AC-6: Symlink-Loop-Test

- Symlink-Zyklus (A→B→A) innerhalb des Vault
- `scan_directory()` detektiert Loop via `symlink_depth()` und loggt Warnung
- Kein unendlicher Loop, kein Stack-Overflow

### Edge Cases

| Case                                          | Verhalten                                                      |
| --------------------------------------------- | -------------------------------------------------------------- |
| Root selbst ist ein Symlink                   | `canonicalize()` löst auf — Containment gegen aufgelösten Root |
| Symlink auf `/dev/null` oder FIFO             | `is_file()` filtert — nicht enthalten                          |
| Symlink auf `.md` außerhalb mit `../` im Pfad | `canonicalize()` löst auf → außerhalb Root → verworfen         |
| Symlink auf nicht-existente Datei             | `fs::metadata()` schlägt fehl → geloggt, übersprungen          |
| Symlink innerhalb des Vault (legitim)         | Wird gescannt                                                  |
| Symlink-Kette (5+ Ebenen)                     | `symlink_depth() > 5` triggert → übersprungen                  |

### Error States

| Error                                           | Behandlung                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------- |
| `canonicalize(root)` schlägt fehl               | Bestehender Fehler: "Verzeichnis existiert nicht" / "Pfad ist kein Verzeichnis" |
| `canonicalize(file)` schlägt fehl               | `log::warn!()`, Datei überspringen, Scan nicht abbrechen                        |
| `read_link()` schlägt fehl in `symlink_depth()` | Fehler in `symlink_depth()` → aufrufende `filter_map` verwirft Entry            |

---

## S4.2 — TreeNode React.memo (Issue #15)

### User Story

**Als** Entwickler
**möchte ich** dass der `TreeNode` mit `React.memo` optimiert ist
**damit** unverändert bleibende Kindknoten beim Expand/Collapse nicht neu gerendert werden.

### Acceptance Criteria

#### AC-1: Kind-`TreeNode` bezieht `isExpanded` aus dem Store

- Jeder `TreeNode`-Kindknoten liest `isExpanded` via `useAppStore(state => state.expandedFolders.has(child.path))`
- Die bisherige Prop-Weitergabe des Eltern-`isExpanded` an Kinder entfällt (Zeile 44 in `TreeNode.tsx`)

#### AC-2: Kind-`TreeNode` bezieht `isSelected` aus dem Store

- Jeder `TreeNode`-Kindknoten liest `isSelected` via `useAppStore(state => state.selectedPromptId === child.prompt_id)`
- Die bisherige Prop-Weitergabe des Eltern-`isSelected` an Kinder entfällt (Zeile 45)

#### AC-3: `React.memo` mit Custom-Comparator

- `TreeNode` wird mit `React.memo` umschlossen
- Custom-Comparator prüft: `node`, `depth`, `isExpanded`, `isSelected`, `onToggle`, `onSelect`
- `onToggle` und `onSelect` sind stabil (`useCallback` oder Store-gebundene Actions)

#### AC-4: Kein Rendering von Kindknoten beim Expand/Collapse des Elternordners

- Vorher: Alle Kindknoten rendern neu, weil Eltern-`isExpanded` sich ändert
- Nachher: Kindknoten merken via `React.memo` dass sie sich nicht geändert haben → kein Re-Render

#### AC-5: existierende Tree-Tests bleiben grün

- `TreeNode.test.tsx` (14 Tests): Alle Tests müssen weiterhin passen
- Tests beziehen korrekt `isExpanded`/`isSelected` aus Props (für Unit-Test-Kontext)

#### AC-6: React DevTools Profiler-Test

- Manuell verifiziert: Expand eines Ordners mit 100 Kind-Dateien triggert **nicht** 100 Re-Renders der Kindknoten
- Nur der expandierte Ordner-Knoten selbst rendert neu

### Edge Cases

| Case                                             | Verhalten                                                     |
| ------------------------------------------------ | ------------------------------------------------------------- |
| Tief verschachtelter Baum (10 Ebenen)            | Memo verhindert Propagation von Re-Renders über Ebenen hinweg |
| `node.prompt_id` ist `undefined` (reiner Ordner) | `isSelected` ist `false`                                      |
| Store-Update ändert `selectedPromptId`           | Nur der betroffene `TreeNode` rendert neu                     |
| Store-Update ändert `expandedFolders`            | Nur der Ordner-Knoten selbst rendert neu, Kindknoten nicht    |

### Error States

Keine — reines Refactoring ohne neue Fehlerpfade.

---

## S4.3 — Pfad-Sanitization (Issue #16)

### User Story

**Als** Benutzer
**möchte ich** dass der Dateibaum keine verwirrenden `".."`-Knoten oder absolute Systempfade zeigt
**damit** der Explorer sauber und verständlich bleibt.

### Acceptance Criteria

#### AC-1: `".."`-Segmente werden aus `fileTree()` entfernt

- Segmente, die exakt `".."` sind, werden beim Splitting verworfen (nicht als Tree-Knoten angelegt)
- Der aktuelle Test `"stellt ../ Segmente als Tree-Knoten dar"` MUSS angepasst werden
- Neuer Test: `".."`-Segmente werden **nicht** als Tree-Knoten dargestellt

#### AC-2: `"."`-Segmente werden aus `fileTree()` entfernt

- Segmente, die exakt `"."` sind, werden beim Splitting verworfen
- Neuer Test: `"."`-Segmente werden nicht als Tree-Knoten dargestellt

#### AC-3: Absolute Pfade werden relativ zum Vault-Root dargestellt

- Wenn der Scanner absolute Pfade liefert (z.B. `/home/user/vault/prompts/test.md`), werden diese relativ zum Vault-Root angezeigt
- Die Relativierung erfolgt in `fileTree()` durch Entfernen des Root-Pfad-Präfixes
- Fallback: Wenn kein Root-Kontext verfügbar ist, wird der Pfad unverändert angezeigt

#### AC-4: Drive-Letter-Pfade (Windows) bleiben unverändert

- `C:\Users\...` Pfade werden normalisiert (Backslash → Slash) aber nicht relativiert
- Drive-Letter als oberste Hierarchieebene bleibt erhalten

#### AC-5: Leere Pfade nach Sanitization

- Ein Pfad wie `vault/../../test.md` (nach Sanitization: `vault/test.md`) muss korrekt im Tree erscheinen
- Wenn Sanitization zu einem leeren Pfad führt → Datei wird nicht in Tree aufgenommen (Warn-Log)

### Edge Cases

| Case                        | Verhalten                                                                 |
| --------------------------- | ------------------------------------------------------------------------- |
| `vault/../outside.md`       | `".."` verworfen → Tree zeigt `vault/outside.md`                          |
| `vault/sub/../../root.md`   | Beide `".."` verworfen → Tree zeigt `vault/root.md`                       |
| `/absolute/path/prompt.md`  | Relativ zum Root dargestellt, z.B. `prompt.md` wenn Root `/absolute/path` |
| `vault/sub/.`               | `"."` verworfen → Tree zeigt `vault/sub/`                                 |
| Pfad besteht nur aus `".."` | Leerer Pfad nach Sanitization → nicht in Tree                             |
| Pfad ist leerer String      | `filter(Boolean)` verwirft bereits → nicht in Tree                        |

### Error States

Keine — Sanitization operiert nur auf String-Ebene im `fileTree()`-Algorithmus.

---

## S4.4 — Store-Unit-Tests (fileTree, filteredPrompts)

### User Story

**Als** Entwickler
**möchte ich** dass die zentralen Store-Derivations (`fileTree()`, `filteredPrompts()`) vollständig getestet sind
**damit** Refactorings und Änderungen sicher durchgeführt werden können.

### Acceptance Criteria

#### AC-1: `fileTree()` — Basis-Tests

- Leerer Prompt-Array → leerer Tree
- Ein Prompt → flacher Tree mit einem Dateiknoten
- Zwei Prompts im selben Ordner → zwei Dateiknoten, alphabetisch sortiert

#### AC-2: `fileTree()` — Verschachtelung

- `folder/sub/prompt.md` → Ordner `folder` → Ordner `sub` → Datei `prompt.md`
- Mehrere Ebenen korrekt abgebildet
- Ordner vor Dateien sortiert, dann alphabetisch

#### AC-3: `fileTree()` — Score- und Favoriten-Zuordnung

- Store enthält `evaluations[prompt.id]` → `fileTree()`-Knoten hat korrektes `score`
- Store enthält `prompts` mit `is_favorite: true` → `fileTree()`-Knoten hat `is_favorite: true`

#### AC-4: `fileTree()` — Sanitization

- `".."`-Segmente werden entfernt (siehe S4.3 AC-1)
- `"."`-Segmente werden entfernt (siehe S4.3 AC-2)
- Leere Pfade nach Sanitization werden ignoriert

#### AC-5: `fileTree()` — Windows-Pfade

- Backslash-Normalisierung: `folder\\sub\\file.md` → korrekter Tree
- UNC-Pfade: `\\\\server\\share\\file.md` → korrekter Tree

#### AC-6: `filteredPrompts()` — Basis-Tests

- Leeres Prompts-Array → leere Ergebnisliste
- Alle Filter deaktiviert → alle Prompts returned
- `search` Filter: Match in title, category, tags, content → korrekt gefiltert

#### AC-7: `filteredPrompts()` — Kombinations-Tests

- `favoritesOnly: true` + `category: "coding"` → nur Coding-Favoriten
- `minScore`/`maxScore` → Score-Filter aus `evaluations`
- `hygieneStatus` → Hygiene-Status-Filter aus `hygiene`
- `tags` Multi-Select → alle Tags müssen matchen

#### AC-8: `filteredPrompts()` — Edge Cases

- `search` mit Groß-/Kleinschreibung: Suche case-insensitive
- `search` mit Sonderzeichen: Kein Regex-Injection-Risiko (einfacher `.includes()`)
- Prompt ohne Evaluation: Score-Filter ignoriert (kein Crash)

### Error States

- Keine — reine Lese-Operationen

---

## S4.5 — Command-Level-Fehlerfall-Tests

### User Story

**Als** Entwickler
**möchte ich** dass alle Tauri Commands bei Fehlern korrekt reagieren
**damit** das Frontend angemessen auf Fehlerzustände reagieren kann.

### Acceptance Criteria

#### AC-1: `scan_directory` — Fehlerfall-Tests

- Nicht-existenter Pfad → `Err("Verzeichnis existiert nicht: ...")`
- Pfad ist Datei, kein Verzeichnis → `Err("Pfad ist kein Verzeichnis: ...")`
- Leerer String als Pfad → `Err` (Verhalten dokumentieren)

#### AC-2: `analyze` Commands — Fehlerfall-Tests

- `evaluate_prompt()` mit unbekannter Prompt-ID → Fehlerbehandlung dokumentieren
- `analyze_hygiene()` mit unbekannter Prompt-ID → Fehlerbehandlung dokumentieren
- `analyze_all()` mit leerer Prompt-Liste → `Ok([])` oder sinnvoller Default

#### AC-3: `export` Commands — Fehlerfall-Tests

- `export_json()` mit ungültigem Zielpfad → `Err(...)`
- `export_markdown()` mit leerer Prompt-Liste → `Err` oder `Ok` mit leerer Export-Datei
- `export_zip()` mit nicht-schreibbarem Verzeichnis → `Err(...)`

#### AC-4: `favorites` Commands — Fehlerfall-Tests

- `toggle_favorite()` mit unbekannter ID → `Err`
- `get_favorites()` bei leerer Datenbank → `Ok([])`

#### AC-5: `persistence` Commands — Fehlerfall-Tests

- `load_cache()` bei nicht-existenter Cache-Datei → `Err` oder `Ok([])`
- `save_cache()` bei nicht-schreibbarem Pfad → `Err`

#### AC-6: `watcher` Commands — Fehlerfall-Tests

- `start_file_watcher()` mit ungültigem Pfad → `Err`
- `stop_file_watcher()` wenn kein Watcher aktiv → `Ok` (idempotent)

### Test-Format

- Rust-Integrationstests unter `src-tauri/tests/` (aktuell leer)
- Jeder Test instanziiert minimale Tauri-App oder testet nur die Logik
- Kein volles Tauri-App-Bootstrapping nötig, wenn Logik-Ebene testbar

### Error States für Frontend-Konsum

Jeder Fehler muss als `Result::Err(String)` mit menschenlesbarer Nachricht zurückgegeben werden.

---

## S4.6 — ESLint Strict Mode

### User Story

**Als** Entwickler
**möchte ich** dass ESLint im Strict Mode läuft
**damit** Type-Safety und Code-Qualität automatisch geprüft werden.

### Acceptance Criteria

#### AC-1: ESLint-Konfiguration existiert

- `.eslintrc.json` oder `eslint.config.js` im Projekt-Root
- Erweitert `@typescript-eslint/strict-type-checked` (oder `recommended-type-checked`)
- `parserOptions.project` verweist auf `tsconfig.json`

#### AC-2: Strengere Regeln als aktuell

- Aktuell nur `ts-basics` — keine explizite ESLint-Config vorhanden
- Neu: `@typescript-eslint/no-unnecessary-type-assertion`, `no-floating-promises`, `strict-boolean-expressions`
- `react-hooks/exhaustive-deps` als Error (nicht Warn)

#### AC-3: Alle existierenden Dateien passen Lint

- `pnpm lint` (angepasst auf neue Config) ergibt 0 Errors und 0 Warnings
- Notwendige Fixes (z.B. `any`-Typen ersetzen, Promise-Handling) werden vorgenommen

#### AC-4: `package.json` Script aktualisiert

- `"lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0"` bleibt kompatibel
- Optional: `"lint:fix": "eslint src --ext ts,tsx --fix"`

### Regeln (Vorschlag)

```json
{
  "extends": [
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:react-hooks/recommended"
  ],
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/strict-boolean-expressions": "warn",
    "react-hooks/exhaustive-deps": "error",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

### Edge Cases

- Keine ESLint-Fehler in `node_modules` (`.eslintignore`)
- Keine Linting von Build-Artifakten
- `vite.config.ts` und `tsconfig.json` vom Linting ausgeschlossen

---

## S4.7 — Pre-commit Hooks

### User Story

**Als** Entwickler
**möchte ich** dass vor jedem Commit automatisch Formatierung, Linting und Kompilierung geprüft wird
**damit** keine fehlerhaften Commits in den `master` gelangen.

### Acceptance Criteria

#### AC-1: Pre-commit Hook existiert

- `.git/hooks/pre-commit` ist ein ausführbares Shell-Skript
- Wird bei `git commit` automatisch ausgeführt

#### AC-2: Rust-Checks

- `cargo fmt --check` — schlägt fehl bei nicht-formatiertem Code
- `cargo clippy -- -D warnings` — schlägt fehl bei Clippy-Warnings

#### AC-3: TypeScript-Checks

- `tsc --noEmit` — schlägt fehl bei TypeScript-Fehlern

#### AC-4: Commit wird blockiert

- Wenn einer der Checks fehlschlägt, wird der Commit abgebrochen
- Fehlermeldung zeigt an, welcher Check fehlgeschlagen ist

#### AC-5: Hook ist dokumentiert

- Hook-Skript enthält Kommentar zur Installation/Deaktivierung
- `TESTING.md` oder `ARCHITECTURE.md` verweist auf Pre-commit-Hooks

#### AC-6: CI validiert die Hooks

- CI-Pipeline (sofern vorhanden) führt dieselben Checks aus
- Lokal und CI verwenden dieselben Befehle → Konsistenz

### Präferenz: Keine externen Tools

- Kein `husky`, kein `lint-staged` — natives `.git/hooks/pre-commit`
- Minimale Dependencies, maximale Transparenz
- Begründung: Weniger Supply-Chain-Risiko, einfacher zu debuggen

### Hook-Skript (Vorschlag)

```bash
#!/bin/bash
set -e

echo "🔍 Pre-commit checks..."

echo "→ cargo fmt --check"
cargo fmt --check --manifest-path src-tauri/Cargo.toml

echo "→ cargo clippy"
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings

echo "→ tsc --noEmit"
pnpm tsc --noEmit

echo "✅ All checks passed"
```

### Edge Cases

- Developer committet nur Frontend-Änderungen: `cargo fmt` und `cargo clippy` laufen trotzdem (weil billig und sicher)
- Developer hat Rust-Toolchain nicht installiert: Hook schlägt fehl → bewusste Entscheidung (kein Rust-Commit ohne Checks)
- CI-only Commits (z.B. Workflow-Dateien): Hook läuft trotzdem, ist schnell genug

---

## Zusammenfassung der Tests (Phase 4)

| ID        | Test-Bereich             | Min. neue Tests                                               |
| --------- | ------------------------ | ------------------------------------------------------------- |
| S4.1      | Symlink-Containment      | 2 (Containment, Loop)                                         |
| S4.2      | TreeNode Memo            | 0 neue (bestehende 14 TreeNode + 8 FileTree)                  |
| S4.3      | Pfad-Sanitization        | 4 (..-Filter, .-Filter, relative Pfade, Sanitization zu leer) |
| S4.4      | Store-Unit-Tests         | 12 (fileTree: 6, filteredPrompts: 6)                          |
| S4.5      | Command-Fehlerfall-Tests | 12 (2 pro Command-Gruppe)                                     |
| S4.6      | ESLint                   | 0 (bestehende Files passen nach Fixes)                        |
| S4.7      | Pre-commit Hooks         | 0 (Infrastruktur, kein Code)                                  |
| **Total** |                          | **mind. 30 neue Tests**                                       |
