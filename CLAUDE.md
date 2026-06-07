# CLAUDE.md — Agent Instructions for PromptVault Lite

> **Diese Datei wird von Claude und kompatiblen Coding-Agents als Projektkontext geladen.**  
> Sie enthält die wichtigsten Projektregeln in kompakter Form.

---

## Project Identity

**PromptVault Lite** — Lokales Prompt-Management-System mit Qualitäts- und Hygieneanalyse.

- Stack: React 18 + TypeScript + Vite (Frontend), Rust + Tauri 2 (Backend), SQLite (Datenhaltung)
- Prinzip: Alles läuft lokal, keine Cloud-Anbindung, keine Telemetrie
- Repo: `xxammaxx/promptvault-lite`

---

## Before ANY Change

1. Read the relevant GitHub Issue (`gh issue view <ISSUE>`)
2. Checkout or create a feature branch (never work on `main` directly)
3. Run `git fetch --all --prune`
4. Start a Context Manifest (`docs/agent/CONTEXT_MANIFEST_TEMPLATE.md`)
5. Plan your work and post a Start Comment on the Issue

---

## During Implementation

- Stay in scope — no scope creep
- Small, atomic commits preferred
- Red tests before green code (or documented test plan)
- Never implement from memory — read the online issue
- Respect existing patterns — no silent refactoring
- Update documentation in parallel with code

---

## Before Completion

```bash
pnpm test                              # Frontend: Vitest
cargo test --manifest-path src-tauri/Cargo.toml  # Rust
pnpm lint                              # ESLint
pnpm build                             # Frontend build
```

- Finalize Context Manifest and Evidence Log
- Post Completion Comment on Issue
- Create PR using template

---

## Hard Constraints

- ❌ Never commit secrets, `.env` files, `*.db` files
- ❌ Never work on `main`/`master` directly
- ❌ Never skip the GitHub Issue comment cycle
- ❌ Never claim something without evidence
- ❌ Never use production data in tests
- ❌ Never implement features without specification
- ❌ Never delete existing tests to make CI green

---

## Key Commands

| Command                                           | What                         |
| ------------------------------------------------- | ---------------------------- |
| `pnpm dev`                                        | Start Vite dev server        |
| `pnpm test`                                       | Run frontend tests           |
| `pnpm test:watch`                                 | Frontend tests in watch mode |
| `pnpm lint`                                       | ESLint                       |
| `pnpm format`                                     | Prettier                     |
| `pnpm build`                                      | TypeScript + Vite build      |
| `pnpm tauri dev`                                  | Full Tauri desktop app (dev) |
| `pnpm tauri build`                                | Production Tauri build       |
| `cargo test --manifest-path src-tauri/Cargo.toml` | Rust tests                   |
| `cargo clippy`                                    | Rust linter                  |
| `cargo fmt`                                       | Rust formatter               |
| `tsc --noEmit`                                    | TypeScript typecheck         |

---

## Key Files

| File                                           | Purpose                                |
| ---------------------------------------------- | -------------------------------------- |
| `AGENTS.md`                                    | Full agent rules (this is the summary) |
| `docs/SECURITY_GATES.md`                       | Security rules                         |
| `docs/agent/CONTEXT_MANIFEST_TEMPLATE.md`      | Context tracking                       |
| `docs/agent/EVIDENCE_LOG_TEMPLATE.md`          | Evidence tracking                      |
| `docs/agent/VERIFICATION_CONTRACT_TEMPLATE.md` | Spec-to-test bridge                    |
| `docs/agent/REVIEWER_CHECKLIST.md`             | Review checklist                       |
| `docs/ARCHITECTURE.md`                         | System architecture                    |
| `docs/TESTING.md`                              | Test guide                             |
| `docs/CHANGELOG.md`                            | Version history                        |
| `.github/pull_request_template.md`             | PR template                            |

---

> **Note:** For complete rules, see `AGENTS.md`. This file is a condensed reference for agent context windows.
