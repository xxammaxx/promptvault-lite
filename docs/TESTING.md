---
title: Testing
description: Tests ausführen, Struktur verstehen und neue Tests ergänzen.
version: 1.7.2-dev
last_updated: 2026-07-06
---

# Testing

## Übersicht der Test-Gates

| Gate              | Command                                                    |
| ----------------- | ---------------------------------------------------------- |
| Frontend Tests    | `pnpm test`                                                |
| ESLint            | `pnpm lint`                                                |
| TypeScript Check  | `pnpm exec tsc --noEmit`                                   |
| Frontend Build    | `pnpm build`                                               |
| Rust Format Check | `cargo fmt --check --all`                                  |
| Rust Clippy       | `cargo clippy --workspace --all-targets -- -D warnings`    |
| Rust Tests        | `cargo test --workspace`                                   |
| Whitespace Check  | `git diff --check`                                         |
| MkDocs Build      | `mkdocs build --strict` (optional, tool gap on some hosts) |
| Playwright E2E    | `pnpm exec playwright test` (optional)                     |

## Rust-Tests ausführen

Aus dem Repository-Root:

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

Oder als workspace:

```bash
cargo test --workspace
```

## Frontend-Tests ausführen

```bash
pnpm test
```

Der Script-Eintrag nutzt Vitest mit @testing-library/react und jsdom.

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
- Regex Regression: `src-tauri/tests/quality_regex_regression.rs`
- Real Corpus Validation: `src-tauri/tests/real_corpus_validation.rs`

### Frontend

- **34+ Test-Dateien** mit Vitest + @testing-library/react + jsdom
- Übliche Pfade sind `src/**/__tests__/*.test.ts` oder `*.test.tsx`
- Store-/Hook-Logik separat testen
- Tauri-Aufrufe mocken, wenn das Verhalten isoliert geprüft werden soll

## Optional: Playwright E2E

```bash
pnpm exec playwright test
```

Playwright ist optional und unterliegt gelegentlichen Tool-Konflikten. Ergebnisse sind nicht blockierend, solange die normalen Gates grün sind.

## Optional: MkDocs

```bash
mkdocs build --strict
```

MkDocs ist auf einigen Hosts nicht installiert (Tool Gap). Dieser Check ist nicht blockierend.

## Remote-CI

GitHub Actions / Remote-CI ist `REMOTE_CI_INFRA_BLOCKED` (Issue #154).
Lokale Gates sind der autoritative Qualitäts-Gate.
Remote-CI-Reruns nicht ohne Owner-Approval auslösen.

## Neue Tests schreiben

### Rust

1. Test in das betroffene Modul unter `#[cfg(test)]` einfügen.
2. Für Dateisystem-Tests `tempfile` verwenden.
3. Reproduzierbare Fixtures nutzen.
4. Erwartete Scores, Artefakte und Fallbacks explizit prüfen.

### Frontend

1. Neue Testdatei neben Komponente oder Hook in `__tests__/` ablegen.
2. React Testing Library und jsdom verwenden.
3. Store-/Hook-Logik separat testen.
4. Tauri-Aufrufe mocken, wenn das Verhalten isoliert geprüft werden soll.
