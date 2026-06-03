---
title: Testing
description: Tests ausführen, Struktur verstehen und neue Tests ergänzen.
version: 1.0.0
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

### Frontend

- Vitest ist im Projekt eingerichtet.
- Derzeit sind noch keine Frontend-Testdateien im Repo eingecheckt.
- Übliche Pfade sind z. B. `src/**/*.test.tsx` oder `src/**/*.spec.tsx`.

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
