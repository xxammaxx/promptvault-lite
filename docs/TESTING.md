---
title: Testing
description: Tests ausführen, Struktur verstehen und neue Tests ergänzen.
version: 1.7.0
---

# Testing

## Rust-Tests ausführen

```bash
cd src-tauri
cargo test
```

Oder aus dem Repository-Root:

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

## Frontend-Tests ausführen

```bash
pnpm test
```

Der Script-Eintrag nutzt Vitest.

## Teststruktur

### Rust

Die meisten Tests liegen direkt in den Modulen als `#[cfg(test)]`-Einheiten:

- Scanner: `src-tauri/src/scanner/file_scanner.rs`
- Frontmatter: `src-tauri/src/parser/frontmatter.rs`
- Markdown-Struktur: `src-tauri/src/parser/markdown.rs`
- Qualitätsanalyse: `src-tauri/src/analysis/quality.rs`
- Hygieneanalyse: `src-tauri/src/analysis/hygiene.rs`
- JSON-Cache: `src-tauri/src/database/cache.rs`
- SQLite: `src-tauri/src/database/sqlite.rs`
- Integration: `src-tauri/tests/command_errors.rs`

### Frontend

- **94 Frontend-Tests in 5 Test-Dateien** (Vitest + @testing-library/react + jsdom).
- Übliche Pfade sind `src/**/*.test.tsx` oder `src/**/*.spec.tsx`. Konkret vorhanden:
  - `src/stores/__tests__/appStore.test.ts`
  - `src/components/explorer/__tests__/FileTree.test.tsx`
  - `src/components/explorer/__tests__/FilterPanel.test.tsx`
  - `src/components/explorer/__tests__/TreeNode.test.tsx`
  - `src/components/analysis/__tests__/AnalysisPanel.test.tsx`

## Neue Tests schreiben

### Rust

1. Test in das betroffene Modul unter `#[cfg(test)]` einfügen.
2. Für Dateisystem-Tests `tempfile` verwenden.
3. Reproduzierbare Fixtures nutzen.
4. Erwartete Scores, Artefakte und Fallbacks explizit prüfen.

### Frontend

1. Neue Testdatei neben Komponente oder Hook ablegen.
2. React Testing Library und jsdom verwenden.
3. Store-/Hook-Logik separat testen.
4. Tauri-Aufrufe mocken, wenn das Verhalten isoliert geprüft werden soll.
