# Project Status — PromptVault Lite

**Last updated:** 2026-06-22
**Current release:** v1.7.0
**Branch:** master

**Blueprint Detection merged:** 2026-06-19 (PR #148)
**Scanner extensions:** `.md`, `.markdown`, `.txt` (1 MiB shared size limit, merged 2026-06-21 via PR #168, #170, #172)
**CodeRabbit:** Removed from active repo (2026-06-19). Zero repo-level references found.
**Real Corpus Pilot:** Completed 2026-06-21 (Issue #166). 46 files remain under manual owner review (72 approved via partial approval dry-run, Issue #166).

---

## Current Status: GREEN 🟢

All 10 local CI gates pass. Master is stable and functional. Remote-CI is `REMOTE_CI_INFRA_BLOCKED` (Issue #154).

---

## Implemented

| Feature                                                | Evidence                                                     | Since  |
| ------------------------------------------------------ | ------------------------------------------------------------ | ------ |
| Local Prompt Archive (recursive .md scan)              | Rust tests: `scanner/file_scanner`                           | v1.0   |
| YAML Frontmatter Parser                                | Rust tests: `parser/frontmatter`                             | v1.0   |
| Quality Analysis (10 criteria)                         | Rust tests: `analysis/quality`                               | v1.0   |
| Hygiene Analysis (18 artifact categories)              | Rust tests: `analysis/hygiene`                               | v1.6.0 |
| Prompt Optimizer (conservative/balanced/aggressive)    | Frontend tests: `promptOptimizer.test.ts`                    | v1.6.0 |
| Dark Mode (light/dark/auto)                            | Frontend tests: `ThemeToggle.test.tsx`                       | v1.6.0 |
| Resizable Explorer                                     | Frontend tests: `FileTree.test.tsx`                          | v1.6.0 |
| Export (JSON, Markdown, ZIP)                           | Rust tests: `commands/export`                                | v1.0   |
| Typed Local Action Layer (13 actions)                  | Frontend tests: `red-tests.test.ts`                          | v1.6.0 |
| Blueprint Detection & Classification                   | Frontend tests: `blueprintDetection.test.ts`                 | v1.7.0 |
| Blueprint Quality Evaluation (10 dimensions)           | Frontend tests: `blueprintDetection.test.ts`                 | v1.7.0 |
| Blueprint Optimization (3 modes)                       | Frontend tests: `blueprintDetection.test.ts`                 | v1.7.0 |
| Blueprint Contamination Detection                      | Frontend tests: `blueprintDetection.test.ts`                 | v1.7.0 |
| Favorites Backend (SQLite persistence)                 | Rust integration tests                                       | v1.5.0 |
| Score Filter                                           | Frontend store logic                                         | v1.5.0 |
| Tauri Desktop App (1400×900 window)                    | Tauri config, local verification                             | v1.0   |
| Windows Path Normalization                             | Rust tests: `scanner/file_scanner`                           | v1.6.0 |
| Symlink Containment                                    | Rust tests: `scanner/file_scanner`                           | v1.6.0 |
| Path-Traversal Protection                              | Rust tests: export commands                                  | v1.4.0 |
| File Watcher (500ms debounce)                          | Rust: `scanner/file_scanner`                                 | v1.0   |
| MIT License                                            | LICENSE file, SPDX                                           | v1.6.0 |
| CI Pipeline definition (frontend + rust + secret scan) | .github/workflows/ci.yml (currently infra-blocked, see #154) | v1.6.0 |

---

## Partially Implemented

| Feature                                     | Status                                                |
| ------------------------------------------- | ----------------------------------------------------- |
| NAS-Mounted Markdown Folder Ingestion       | ✅ Merged (PR #145, 2026-06-20) — now on master       |
| Scanner Extension Support (.txt, .markdown) | ✅ Merged (PR #168, #170, 2026-06-21) — now on master |
| Shared File Size Limit (1 MiB)              | ✅ Merged (PR #172, 2026-06-21) — now on master       |
| Settings Modal                              | Planned (#63), not started                            |

---

## Not Present

- Native binary releases (source-only install)
- Cloud backend / API / telemetry
- Prompt suggestions workflow (#45)
- Agentic Browser Repair Kit (#71)
- Docker deployment (issues #126–128 open)
- macOS/Windows CI (only Linux in CI)

---

## Known Limitations

- **Source-only release:** No native binary build pipeline configured
- **Linux-only CI:** No macOS or Windows CI runners
- **Repository visibility:** Private (requires owner approval to change to public)
- **No repository topics set on GitHub**
- **No homepage URL configured**
- **Placeholder release icons:** #82 closed as completed (2026-06-12)

---

## Test Summary (2026-06-22)

| Suite                             | Tests | Result                          |
| --------------------------------- | ----- | ------------------------------- |
| Frontend (Vitest)                 | 650   | PASS (22 files)                 |
| Rust Unit (lib)                   | 134   | PASS (+1 ignored)               |
| Rust Integration (command_errors) | 17    | PASS                            |
| ESLint                            | —     | PASS (0 errors, 0 warnings)     |
| TypeScript                        | —     | PASS (tsc --noEmit, 0 errors)   |
| cargo fmt                         | —     | PASS                            |
| cargo clippy                      | —     | PASS (0 warnings)               |
| cargo build                       | —     | PASS                            |
| pnpm build                        | —     | PASS                            |
| mkdocs build --strict             | —     | PASS                            |
| Local CI (10 gates, master)       | 10/10 | PASS (local-CI-first, see #154) |
| Remote CI (GitHub Actions)        | —     | REMOTE_CI_INFRA_BLOCKED         |

---

## OpenCode Agent Runtime (2026-06-22)

| Check      | Result                                  |
| ---------- | --------------------------------------- |
| Version    | 1.15.0                                  |
| Provider   | DeepSeek (deepseek-v4-pro)              |
| Agent Mode | issue-orchestrator                      |
| gh CLI     | 2.92.0                                  |
| OS/Shell   | Windows 10 (10.0.19045), PowerShell 5.1 |
| Node       | v24.14.0                                |
| pnpm       | 11.5.2                                  |
| Git        | 2.47.0.windows.1                        |
| Rust       | 1.96.0                                  |

> Previous run (2026-06-19) used deepseek-v4-pro / issue-orchestrator. Consistently OpenCode 1.15.0.

---

## Next Steps (Recommended)

1. **Owner Review (remaining):** Review 46 remaining sensitive-flagged corpus files — 72 approved via partial approval dry-run, 46 NEEDS_MANUAL_REVIEW (Issue #166)
2. **Owner Decision:** Review `docs/CANONICAL_PROMPT_STANDARD.md` (Issue #165) — commit or archive
3. **llms.txt:** ✅ CLOSED — Regenerated as part of v1.7.0 finalization (Issue #164)
4. **Defer after release:** Web/LAN Backend Adapter MVP (Issues #97–#142)
5. **Backlog Cleanup:** P3 documentation issues (#40, #42, #43)
6. **Settings Modal:** Implement post-release (#63)
