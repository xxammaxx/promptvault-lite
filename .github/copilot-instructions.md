# GitHub Copilot Instructions for PromptVault Lite

> **Diese Datei wird von GitHub Copilot als Projektkontext verwendet.**  
> Sie enthält Coding-Konventionen, Projektregeln und Sicherheitsvorgaben.

---

## Project Context

- **Name:** PromptVault Lite
- **Type:** Tauri 2 Desktop App (React 18 + TypeScript + Rust)
- **Principle:** Local-first, no cloud, no telemetry
- **Database:** SQLite with FTS5 (project-local only)
- **Testing:** Vitest (frontend), `cargo test` (Rust), ESLint + Prettier

---

## General Rules

- Always work on a feature branch, never on `main`
- Every change must be linked to a GitHub Issue
- Read `AGENTS.md` for full agent workflow rules
- Never commit secrets, `.env` files, or `*.db` files
- Never use real production data in tests
- Follow the Spec-Driven Development workflow for features

---

## TypeScript Conventions

- Strict mode enabled (`tsconfig.json` `strict: true`)
- No `any` types (ESLint: `@typescript-eslint/no-explicit-any: error`)
- Use `import type` for type-only imports
- Prefer discriminated unions over enums
- React components use `React.FC` or explicit return types
- Use Zustand for state management (`src/stores/appStore.ts`)
- Follow existing component patterns in `src/components/`

---

## Rust Conventions

- Use `Result<T, String>` for Tauri Commands
- Use `#[cfg(test)]` for unit tests within modules
- Integration tests go in `src-tauri/tests/`
- Follow Rust 2021 idioms
- Run `cargo clippy` and `cargo fmt` before committing
- Document public API with doc comments (`///`)

---

## File Patterns

```
src/
├── components/
│   ├── analysis/        # Quality & hygiene analysis UI
│   ├── details/         # Prompt detail view
│   ├── explorer/        # File tree & filters
│   └── __tests__/       # Component tests
├── hooks/               # Custom React hooks
├── lib/                 # Tauri API wrapper
├── stores/              # Zustand stores
│   └── __tests__/       # Store tests
└── types/               # TypeScript type definitions
```

---

## Testing Rules

- Write tests alongside components (co-location)
- Mock Tauri API calls in frontend tests
- Use `@testing-library/react` for component tests
- Use `tempfile` for Rust file system tests
- Red tests before implementation code
- Document test baseline before any changes

---

## Security Rules

- No hardcoded credentials
- No network calls in core analysis engine
- Validate all file paths (path traversal protection)
- Sanitize user input before display
- Never log sensitive data
- See `docs/SECURITY_GATES.md` for complete rules

---

## Commit Style

Follow Conventional Commits:

- `feat(scope): description` — new feature
- `fix(scope): description` — bug fix
- `docs(scope): description` — documentation
- `chore(scope): description` — maintenance
- `test(scope): description` — tests
- `refactor(scope): description` — refactoring
- `security(scope): description` — security changes
