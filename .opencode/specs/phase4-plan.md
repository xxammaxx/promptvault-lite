# PromptVault Lite Phase 4 — Implementation Plan

## Version: 1.4.0 — Security-Härtung & Developer Experience

---

## Übersicht

Die Implementierung folgt 4 parallelen Strängen, gruppiert nach betroffenem Subsystem:

| Strang    | Subsystem            | Tasks                                                              | Geschätzte Zeit |
| --------- | -------------------- | ------------------------------------------------------------------ | --------------- |
| A         | Backend Security     | S4.1 Symlink-Containment, S4.5 Command-Fehlerfall-Tests (Rust)     | 5h              |
| B         | Frontend Optimierung | S4.2 TreeNode Memo, S4.3 Pfad-Sanitization                         | 4h              |
| C         | Testing              | S4.4 Store-Unit-Tests, S4.5 Command-Fehlerfall-Tests (Integration) | 5h              |
| D         | Developer Experience | S4.6 ESLint Strict, S4.7 Pre-commit Hooks                          | 2h              |
| **Total** |                      | **7 Feature-Stränge**                                              | **~16h**        |

---

## Strang A: Backend Security

### Betroffene Module

| Datei                                   | Änderungsart                        | Komplexität |
| --------------------------------------- | ----------------------------------- | ----------- |
| `src-tauri/src/scanner/file_scanner.rs` | 🔴 MODIFY (Zeile 42-69, +40 Zeilen) | Mittel      |
| `src-tauri/tests/command_errors.rs`     | 🆕 CREATE (~120 Zeilen)             | Niedrig     |

### Abhängigkeiten

- Keine Abhängigkeiten zu anderen Strängen (unabhängiges Rust-Modul)
- **MUSS zuerst**: Symlink-Containment sichert den Scanner ab, bevor andere Tests geschrieben werden

### Implementierungs-Reihenfolge (Strang A)

```
A1: Symlink-Containment in scan_directory()
    ├── canonicalize() auf root_path
    ├── Containment-Check für jede Datei vor dem Einlesen
    └── Bestehende 7 Scanner-Tests validieren
A2: Symlink-Containment-Tests (2 neue Tests)
    ├── Test: externer Symlink → wird nicht gescannt
    └── Test: Symlink-Loop → erkannt + geloggt (existiert teilweise)
A3: Command-Fehlerfall-Tests Rust (~6 Tests)
    ├── scan_directory: nicht-existenter Pfad, Pfad=Datei, leerer String
    ├── (Weitere Command-Tests in Strang C)
    └── cargo test muss alle neuen Tests grün zeigen
```

### Technische Entscheidungen (Strang A)

1. **`canonicalize()` vs `follow_links(false)`**
   - Entscheidung: `canonicalize()` + Containment-Check (wie spezifiziert)
   - Begründung: Legitime interne Symlinks sollen weiterhin aufgelöst werden
   - `follow_links(false)` wäre simpler, würde aber auch interne Symlinks deaktivieren

2. **Containment-Check per `starts_with()`**
   - Entscheidung: `canonical_file_path.starts_with(&canonical_root)`
   - Edge: Nach einem `/` im Root-Präfix muss das Trennzeichen Teil des Prefixes sein
   - Implementierung: Root mit abschließendem `/` normalisieren oder `Path::starts_with()` verwenden

---

## Strang B: Frontend Optimierung

### Betroffene Module

| Datei                                                 | Änderungsart                            | Komplexität |
| ----------------------------------------------------- | --------------------------------------- | ----------- |
| `src/components/explorer/TreeNode.tsx`                | 🔴 MODIFY (Zeile 13-20, ~50 Zeilen)     | Mittel      |
| `src/stores/appStore.ts` (`fileTree`)                 | 🟡 MODIFY (Zeile 222-226, ~15 Zeilen)   | Niedrig     |
| `src/components/explorer/__tests__/TreeNode.test.tsx` | 🟡 MODIFY (Anpassung Store-Mocking)     | Niedrig     |
| `src/components/explorer/__tests__/FileTree.test.tsx` | 🟡 MODIFY (Sanitization-Tests anpassen) | Mittel      |
| `src/types/index.ts`                                  | 🟢 (keine Änderung nötig)               | —           |

### Abhängigkeiten

- **Abhängig von Strang A**: Pfad-Sanitization (S4.3) profitiert von Symlink-Containment (sicherere Pfade)
- **Abhängig von Strang D**: ESLint strict mode könnte `TreeNode`-Refactor beeinflussen

### Implementierungs-Reihenfolge (Strang B)

```
B1: TreeNode Refactor — isExpanded/isSelected aus Store
    ├── Kind-TreeNode: isExpanded via useAppStore(s => s.expandedFolders.has(path))
    ├── Kind-TreeNode: isSelected via useAppStore(s => s.selectedPromptId === prompt_id)
    ├── Eltern-Prop-Weitergabe (Zeile 44/45) entfernen
    └── Alle 14 TreeNode-Tests müssen grün bleiben

B2: React.memo auf TreeNode
    ├── Custom-Comparator für Props-Equality
    ├── Stabilisierung von onToggle/onSelect (useCallback in FileTree)
    └── React DevTools Verifikation (manuell)

B3: Pfad-Sanitization in fileTree()
    ├── ".." Segmente filtern (line 222-226 in appStore.ts)
    ├── "." Segmente filtern
    ├── Test-Anpassung: FileTree.test.tsx AC-3 (von "stellt dar" → "filtert aus")
    └── Neue Sanitization-Tests (4 Tests)

B4: cross-module Integrationstest
    ├── fileTree() + TreeNode Integration
    └── Sanitized-Pfade im Tree korrekt dargestellt
```

### Technische Entscheidungen (Strang B)

1. **Store-basierte Props vs Prop-Drilling beenden**
   - Entscheidung: Store-Selectoren in jedem TreeNode (wie spezifiziert)
   - Begründung: `zustand` Selectoren sind O(1) und triggern nur spezifische Re-Renders
   - Alternative: `useContext` wäre unnötig komplex für diesen Fall

2. **Sanitization-Ort: `fileTree()` vs Rendering-Schicht**
   - Entscheidung: Sanitization in `fileTree()` (wie spezifiziert)
   - Begründung: Datenbereinigung gehört in die Daten-Transformations-Schicht, nicht ins Rendering

---

## Strang C: Testing

### Betroffene Module

| Datei                                   | Änderungsart                         | Komplexität |
| --------------------------------------- | ------------------------------------ | ----------- |
| `src/stores/__tests__/appStore.test.ts` | 🆕 CREATE (~200 Zeilen)              | Mittel      |
| `src-tauri/tests/command_errors.rs`     | 🆕 CREATE (~150 Zeilen)              | Mittel      |
| `src-tauri/tests/`                      | 🆕 CREATE (Verzeichnis aktuell leer) | —           |
| `src/stores/__tests__/`                 | 🆕 CREATE (Verzeichnis)              | —           |

### Abhängigkeiten

- **Abhängig von Strang A**: Command-Fehlerfall-Tests testen Änderungen aus S4.1 mit
- **Abhängig von Strang B**: Store-Tests validieren Pfad-Sanitization aus S4.3

### Implementierungs-Reihenfolge (Strang C)

```
C1: Store-Unit-Tests (fileTree)
    ├── Setup: vitest + Store-Reset in beforeEach
    ├── Tests: leerer Baum, flacher Baum, verschachtelt, Score/Favoriten
    ├── Tests: Sanitization (..-Filter, .-Filter, leere Pfade)
    └── Tests: Windows-Pfade (Backslash, UNC, Drive-Letter)

C2: Store-Unit-Tests (filteredPrompts)
    ├── Tests: alle Filter deaktiviert, search (case-insensitive)
    ├── Tests: favoritesOnly, category, tags Kombinationen
    ├── Tests: minScore/maxScore mit evaluations
    └── Tests: hygieneStatus mit hygiene-Daten

C3: Command-Fehlerfall-Tests (Rust Integration)
    ├── scan_directory: nicht-existenter Pfad, Pfad=Datei, leerer String
    ├── analyze: unbekannte ID, leere Batch
    ├── export: ungültiger Pfad, leere Prompt-Liste, nicht-schreibbar
    ├── favorites: unbekannte ID, leere DB
    ├── persistence: nicht-existenter Cache, nicht-schreibbar
    └── watcher: ungültiger Pfad, Stop ohne Watcher (idempotent)
```

---

## Strang D: Developer Experience

### Betroffene Module

| Datei                   | Änderungsart                        | Komplexität |
| ----------------------- | ----------------------------------- | ----------- |
| `.eslintrc.json`        | 🆕 CREATE (~30 Zeilen)              | Niedrig     |
| `.eslintignore`         | 🆕 CREATE (~5 Zeilen)               | Niedrig     |
| `.git/hooks/pre-commit` | 🆕 CREATE (~20 Zeilen)              | Niedrig     |
| `package.json`          | 🟡 MODIFY (lint script)             | Niedrig     |
| `src/` (verschiedene)   | 🟡 MODIFY (ESLint-Fixes, ~variabel) | Variabel    |

### Abhängigkeiten

- **MUSS zuletzt**: ESLint Strict Mode wird nach allen Code-Änderungen aktiviert
- **MUSS zuletzt**: Pre-commit Hook validiert alle vorherigen Änderungen

### Implementierungs-Reihenfolge (Strang D)

```
D1: ESLint Strict Mode Konfiguration
    ├── .eslintrc.json erstellen (strict-type-checked)
    ├── .eslintignore für node_modules, dist, src-tauri
    ├── pnpm lint ausführen → Fehler dokumentieren
    └── Code-Fixes für ESLint-Fehler (vor allem any-Typen, Promises)

D2: Pre-commit Hook
    ├── .git/hooks/pre-commit erstellen
    ├── chmod +x setzen
    ├── cargo fmt --check + cargo clippy + tsc --noEmit
    └── Dokumentation in TESTING.md

D3: Finaler Quality Gate Lauf
    ├── pnpm lint → 0 Fehler
    ├── cargo clippy → 0 Warnings
    ├── tsc --noEmit → 0 Fehler
    ├── cargo test → alle grün
    └── pnpm test → alle grün
```

---

## Gesamtabhängigkeitsgraph

```
Strang A (Backend Security) ────────────────────┐
  A1: Symlink-Containment                        │
  A2: Containment-Tests                          ├──→ Strang C (Testing)
  A3: Command-Fehlerfall-Tests (Rust) ───────────┘        │
                                                          │
Strang B (Frontend) ─────────────┐                       │
  B1: TreeNode Refactor          │                       │
  B2: React.memo                 ├──→ Strang C (Testing)─┤
  B3: Pfad-Sanitization          │                       │
  B4: Integrationstest           │                       │
                                 │                       │
Strang C (Testing) ──────────────┘                       │
  C1: Store-Tests fileTree                               │
  C2: Store-Tests filteredPrompts                        │
  C3: Command-Fehlerfall-Tests (Integration) ────────────┘
                                                          │
Strang D (DX) ───────────────────────────────────────────┘
  D1: ESLint Strict Mode         (nach A+B+C)
  D2: Pre-commit Hook            (nach D1)
  D3: Quality Gate               (nach D2)
```

## Empfohlene Ausführungsreihenfolge

1. **A1-A2** (Symlink-Containment): Sicherheits-Fix zuerst, ~2h
2. **B1-B2** (TreeNode Memo): Parallel zu A3, ~2h
3. **A3 + C3** (Command-Fehlerfall-Tests): Nach A1, parallel zu B3, ~3h
4. **B3** (Pfad-Sanitization): Nach B2, parallel zu C1-C2, ~2h
5. **C1-C2** (Store-Tests): Nach B3 (testet Sanitization mit), ~3h
6. **D1** (ESLint): Nach allen Code-Änderungen, ~1h
7. **D2-D3** (Pre-commit + Quality Gate): Letzter Schritt, ~1h

### Blockierende Abhängigkeiten

- D1 (ESLint) BLOCKIERT alle anderen Stränge: Code muss vorher stehen
- C1-C2 (Store-Tests) BLOCKIERT durch B3: Tests validieren Sanitization-Logik
- C3 (Command-Tests) BLOCKIERT durch A2: Tests validieren Containment-Verhalten

---

## Risiken & Mitigation

| Risiko                                                              | Eintrittsw. | Auswirkung | Mitigation                                                    |
| ------------------------------------------------------------------- | ----------- | ---------- | ------------------------------------------------------------- |
| `canonicalize()` auf Windows verhält sich anders                    | Mittel      | Mittel     | Windows-Test in CI (Phase 3 hat Plattform-Tests etabliert)    |
| ESLint strict deckt viele `any`-Typen auf                           | Hoch        | Niedrig    | Typen vorab prüfen, `unknown` statt `any`                     |
| `React.memo` Custom-Comparator falsch konfiguriert → kein Memoizing | Mittel      | Mittel     | React DevTools Profiler manuell verifizieren                  |
| Command-Fehlerfall-Tests benötigen Tauri-Bootstrapping              | Niedrig     | Mittel     | Logik-Ebene testen, nicht full Tauri-App                      |
| Pre-commit Hook verlangsamt Commit merklich                         | Niedrig     | Niedrig    | `cargo fmt` ist instant, `clippy` ~5s, `tsc` ~3s → ~10s total |

---

## Affected File Summary

```
NEUE DATEIEN:
  .eslintrc.json
  .eslintignore
  .git/hooks/pre-commit
  src/stores/__tests__/appStore.test.ts
  src-tauri/tests/command_errors.rs

MODIFIZIERTE DATEIEN:
  src-tauri/src/scanner/file_scanner.rs    (+40 LOC, Containment-Logic)
  src/components/explorer/TreeNode.tsx      (~50 LOC, Store-Selectors + memo)
  src/stores/appStore.ts                    (~15 LOC, Pfad-Sanitization)
  src/components/explorer/__tests__/FileTree.test.tsx  (Sanitization-Test anpassen)
  package.json                              (lint script)

UNVERÄNDERTE DATEIEN (betroffen durch Tests):
  src/components/explorer/__tests__/TreeNode.test.tsx
  src-tauri/src/commands/scan.rs
  src-tauri/src/commands/analyze.rs
  src-tauri/src/commands/export.rs
  src-tauri/src/commands/favorites.rs
  src-tauri/src/commands/persistence.rs
  src-tauri/src/scanner/watcher.rs
```
