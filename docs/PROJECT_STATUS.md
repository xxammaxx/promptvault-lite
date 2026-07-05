# Project Status — PromptVault Lite

**Last updated:** 2026-07-05
**Current release:** v1.7.1 (public stable)
**Branch:** master
**Master since v1.7.1:** PR #185 (UI/Optimizer/Classification/Layout Fixes) merged 2026-06-24, PR #186 (Settings Modal, closes #63) merged 2026-07-02, PR #190 (GUIDELINE classification) merged 2026-07-03, PR #192 (real-corpus classification reasons) merged 2026-07-03, PR #196 (regex/backtracking hardening) merged 2026-07-03, PR #197 (BLUEPRINT/DOC boundary) merged 2026-07-03, PR #198 (UNKNOWN fallback explanations) merged 2026-07-04

**Blueprint Detection merged:** 2026-06-19 (PR #148)
**Scanner extensions:** `.md`, `.markdown`, `.txt` (1 MiB shared size limit, merged 2026-06-21 via PR #168, #170, #172)
**CodeRabbit:** Removed from active repo (2026-06-19). Zero repo-level references found.
**Real Corpus Pilot:** Completed 2026-06-21 (Issue #166 — closed 2026-06-23). Pilot scan finished; 117/117 files scanned successfully. Corpus review finalized: 114 ALLOW_IMPORT + 3 ALLOW_IMPORT_REDACTED + 1 EXCLUDE. Open manual reviews: 0.
**Five-File Sanitized Evidence:** Playwright smoke test of 5 `.md` files from local owner prompt folder (Issue #187, 2026-07-02). Validated: 0 console errors, 0 external network calls, 5/5 analysis views rendered. Not a full 188-file corpus validation.

---

## Current Status: GREEN 🟢

All 10 local CI gates pass. Master is stable and functional. Remote-CI is `REMOTE_CI_INFRA_BLOCKED` (Issue #154).

---

## Implemented

| Feature                                                | Evidence                                                            | Since  |
| ------------------------------------------------------ | ------------------------------------------------------------------- | ------ |
| Local Prompt Archive (recursive .md scan)              | Rust tests: `scanner/file_scanner`                                  | v1.0   |
| YAML Frontmatter Parser                                | Rust tests: `parser/frontmatter`                                    | v1.0   |
| Quality Analysis (10 criteria)                         | Rust tests: `analysis/quality`                                      | v1.0   |
| Hygiene Analysis (18 artifact categories)              | Rust tests: `analysis/hygiene`                                      | v1.6.0 |
| Prompt Optimizer (conservative/balanced/aggressive)    | Frontend tests: `promptOptimizer.test.ts`                           | v1.6.0 |
| Dark Mode (light/dark/auto)                            | Frontend tests: `ThemeToggle.test.tsx`                              | v1.6.0 |
| Resizable Explorer                                     | Frontend tests: `FileTree.test.tsx`                                 | v1.6.0 |
| Export (JSON, Markdown, ZIP)                           | Rust tests: `commands/export`                                       | v1.0   |
| Typed Local Action Layer (13 actions)                  | Frontend tests: `red-tests.test.ts`                                 | v1.6.0 |
| Blueprint Detection & Classification                   | Frontend tests: `blueprintDetection.test.ts`                        | v1.7.0 |
| Blueprint Quality Evaluation (10 dimensions)           | Frontend tests: `blueprintDetection.test.ts`                        | v1.7.0 |
| Blueprint Optimization (3 modes)                       | Frontend tests: `blueprintDetection.test.ts`                        | v1.7.0 |
| Blueprint Contamination Detection                      | Frontend tests: `blueprintDetection.test.ts`                        | v1.7.0 |
| Favorites Backend (SQLite persistence)                 | Rust integration tests                                              | v1.5.0 |
| Score Filter                                           | Frontend store logic                                                | v1.5.0 |
| Tauri Desktop App (1400×900 window)                    | Tauri config, local verification                                    | v1.0   |
| Windows Path Normalization                             | Rust tests: `scanner/file_scanner`                                  | v1.6.0 |
| Symlink Containment                                    | Rust tests: `scanner/file_scanner`                                  | v1.6.0 |
| Path-Traversal Protection                              | Rust tests: export commands                                         | v1.4.0 |
| File Watcher (500ms debounce)                          | Rust: `scanner/file_scanner`                                        | v1.0   |
| MIT License                                            | LICENSE file, SPDX                                                  | v1.6.0 |
| CI Pipeline definition (frontend + rust + secret scan) | .github/workflows/ci.yml (currently infra-blocked, see #154)        | v1.6.0 |
| UI/Optimizer/Classification/Layout Fixes               | PR #185 merged 2026-06-24, frontend tests PASS                      | master |
| Settings Modal (theme, export format, dev mode, reset) | Frontend tests: `SettingsModal.test.tsx`, PR #186 merged 2026-07-02 | master |

---

## On Master (Not Yet in v1.7.1 Release)

| Feature                                     | Status                                                             |
| ------------------------------------------- | ------------------------------------------------------------------ |
| NAS-Mounted Markdown Folder Ingestion       | ✅ Merged (PR #145, 2026-06-20)                                    |
| Scanner Extension Support (.txt, .markdown) | ✅ Merged (PR #168, #170, 2026-06-21)                              |
| Shared File Size Limit (1 MiB)              | ✅ Merged (PR #172, 2026-06-21)                                    |
| UI/Optimizer/Classification/Layout Fixes    | ✅ Merged (PR #185, 2026-06-24)                                    |
| Settings Modal (#63)                        | ✅ Merged (PR #186, 2026-07-02) — on master, not in v1.7.1 release |
| GUIDELINE Classification                    | ✅ Merged (PR #190, 2026-07-03)                                    |
| Real-Corpus Classification Reasons          | ✅ Merged (PR #192, 2026-07-03)                                    |
| Regex/Backtracking Hardening                | ✅ Merged (PR #196, 2026-07-03)                                    |
| BLUEPRINT/DOCUMENTATION Boundary Refinement | ✅ Merged (PR #197, 2026-07-03)                                    |
| UNKNOWN Confidence / Fallback Explanations  | ✅ Merged (PR #198, 2026-07-04)                                    |

---

## Not Present

- Signed/code-signed binaries (Windows installer is unsigned)
- Auto-updater
- macOS/Linux native installers (Windows x64 only)
- Cloud backend / API / telemetry
- Prompt suggestions workflow (#45)
- Agentic Browser Repair Kit (#71)
- Docker deployment (issues #126–128 open)
- macOS/Windows CI (only Linux in CI)

---

## Known Limitations

- **Windows installer unsigned:** SmartScreen shows "Unknown publisher" warning; no code signing certificate
- **No auto-updater:** Manual download required for each release
- **Linux-only CI:** No macOS or Windows CI runners
- **Repository visibility:** Public (made public 2026-06-23 as part of v1.7.0 finalization)
- **Repository topics:** 10 topics configured (desktop-app, local-first, offline-first, prompt-engineering, prompt-management, react, rust, sqlite, tauri, typescript)
- **No homepage URL configured**
- **Placeholder release icons:** #82 closed as completed (2026-06-12)

---

## Test Summary (2026-07-05)

| Suite                             | Tests | Result                                           |
| --------------------------------- | ----- | ------------------------------------------------ |
| Frontend (Vitest)                 | 665   | PASS (26 files)                                  |
| Rust Unit (lib)                   | 134   | PASS (+1 ignored)                                |
| Rust Integration (command_errors) | 17    | PASS                                             |
| Rust Regex Regression             | 5     | PASS                                             |
| Rust Real Corpus Validation       | 1     | IGNORED (requires real prompt folder)            |
| Rust Total                        | 156   | PASS (2 ignored)                                 |
| ESLint                            | —     | PASS (0 errors, 0 warnings)                      |
| TypeScript                        | —     | PASS (tsc --noEmit, 0 errors)                    |
| cargo fmt                         | —     | PASS                                             |
| cargo clippy                      | —     | PASS (0 warnings)                                |
| cargo build                       | —     | PASS                                             |
| pnpm build                        | —     | PASS                                             |
| mkdocs build --strict             | —     | TOOL_MISSING (mkdocs not installed on this host) |
| Local CI (11 gates, master)       | 10/11 | PASS (mkdocs excluded — tool gap)                |
| Remote CI (GitHub Actions)        | —     | REMOTE_CI_INFRA_BLOCKED                          |

---

## OpenCode Agent Runtime (2026-07-02)

| Check      | Result                     |
| ---------- | -------------------------- |
| Version    | 1.15.0                     |
| Provider   | DeepSeek (deepseek-v4-pro) |
| Agent Mode | issue-orchestrator         |
| gh CLI     | 2.45.0                     |
| OS/Shell   | Linux (Ubuntu), bash       |
| Node       | v22.22.0                   |
| pnpm       | 11.1.0                     |
| Git        | 2.43.0                     |
| Rust       | 1.95.0                     |

> This run: Linux host with OpenCode 1.15.0 / deepseek-v4-pro. Previous run (2026-06-22) was on Windows 10 / PowerShell 5.1.

---

## Next Steps (Recommended)

1. **Corpus Import (pending):** Corpus review completed (0 open manual reviews). Final decisions: 114 ALLOW_IMPORT + 3 ALLOW_IMPORT_REDACTED + 1 EXCLUDE. Import execution deferred pending owner approval.
2. **CANONICAL_PROMPT_STANDARD.md:** ✅ CLOSED — Archived to `.opencode/history/issue-165/` as historical reference (Issue #165 closed 2026-06-23).
3. **llms.txt:** ✅ CLOSED — Regenerated as part of v1.7.0 finalization (Issue #164)
4. **Defer after release:** Web/LAN Backend Adapter MVP (Issues #97–#142)
5. **Backlog Cleanup:** P3 documentation issues (#40, #42, #43)
6. **Settings Modal (#63):** ✅ MERGED (PR #186, 2026-07-02) — on master, not in v1.7.1 release
7. **Issue #187 — Five-File Playwright Evidence:** ✅ Validated (2026-07-02) — sanitized evidence on GitHub. Next: full 188-file corpus run.
8. **Known Gaps:** Classification labels missing for `agent_prompt_candidate`, score labels empty in web mode, Tauri-specific analysis not fully tested in web mode, mkdocs not installed on this host.
