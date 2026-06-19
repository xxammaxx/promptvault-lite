# Evidence Portfolio — PromptVault Lite

> Living Software Portfolio. Updated with every significant agent run.
> No marketing claims — only evidence-backed facts.

**Last evidence run:** 2026-06-19 (OpenCode 1.15.0, deepseek-v4-pro / issue-orchestrator)
**Blueprint detection run:** 2026-06-19 (OpenCode 1.15.0, deepseek-v4-pro / issue-orchestrator)

---

## Current Capabilities (Evidence-Backed)

| Capability                                                         | Evidence                               | Last Verified |
| ------------------------------------------------------------------ | -------------------------------------- | ------------- |
| Recursive .md file scanning with Windows path support              | 13 Rust tests PASS                     | 2026-06-19    |
| YAML frontmatter parsing (UTF-8, special chars)                    | 11 Rust tests PASS                     | 2026-06-19    |
| Quality scoring (10 criteria, multi-language)                      | 17 Rust tests + 67 frontend tests PASS | 2026-06-19    |
| Hygiene detection (18 artifact categories)                         | 27 Rust tests PASS                     | 2026-06-19    |
| Prompt optimization (3 modes, deterministic)                       | 54 frontend tests PASS                 | 2026-06-19    |
| Dark mode (auto-detect, localStorage persist)                      | 10 frontend tests PASS                 | 2026-06-19    |
| File tree with search, filter, favorites                           | 50 frontend tests PASS                 | 2026-06-19    |
| Export (JSON, Markdown, ZIP) with path safety                      | 10 Rust tests PASS                     | 2026-06-19    |
| Typed local action layer (13 actions)                              | 44 frontend tests PASS                 | 2026-06-19    |
| Blueprint detection & classification (7 classes)                   | 35 frontend tests PASS                 | 2026-06-19    |
| Blueprint quality evaluation (10 dimensions)                       | 35 frontend tests PASS                 | 2026-06-19    |
| Blueprint optimization (3 modes, conservative/balanced/aggressive) | 35 frontend tests PASS                 | 2026-06-19    |
| Blueprint contamination detection (foreign apps, stale, secrets)   | 35 frontend tests PASS                 | 2026-06-19    |
| Tauri IPC command layer                                            | 17 Rust integration tests PASS         | 2026-06-19    |
| SQLite/FTS5 database layer                                         | 14 Rust tests PASS                     | 2026-06-19    |
| Symlink containment & path traversal protection                    | 10 Rust tests PASS                     | 2026-06-19    |
| CI: Frontend (tsc+lint+test+build)                                 | GitHub Actions — PASS                  | 2026-06-19    |
| CI: Rust (fmt+clippy+test+build)                                   | GitHub Actions — PASS                  | 2026-06-19    |
| CI: Secret Scan                                                    | GitHub Actions — PASS                  | 2026-06-19    |

---

## New Capabilities Since v1.6.0

| Capability                           | PR/Issue       | Status                    |
| ------------------------------------ | -------------- | ------------------------- |
| NAS-mounted markdown folder scanning | #145           | In PR review              |
| Optimizer placeholder hardening      | Current branch | Review-ready (2026-06-18) |

---

## Removed Blockers

| Blocker                                | Resolution | When   |
| -------------------------------------- | ---------- | ------ |
| pnpm v9 workspace error in CI          | #79        | v1.6.0 |
| Ubuntu 24.04 apt conflict              | #79        | v1.6.0 |
| Tauri icon build blocker               | #81        | v1.6.0 |
| Evaluation corpus calibration failures | #94        | v1.6.0 |

---

## Unchanged Limitations

| Limitation                               | Since | Notes                                |
| ---------------------------------------- | ----- | ------------------------------------ |
| Source-only release (no native binaries) | v1.0  | No binary build pipeline yet         |
| Linux-only CI                            | v1.0  | No macOS/Windows runners             |
| Placeholder release icons                | v1.0  | #82 closed as completed (2026-06-12) |
| Private GitHub repository                | v1.0  | Not publicly visible                 |
| No Docker deployment                     | v1.0  | Issues #126–128 open                 |

---

## Screenshot Evidence

| Screenshot          | File                                                     |
| ------------------- | -------------------------------------------------------- |
| Light Mode Overview | `docs/assets/screenshots/promptvault-overview-light.png` |
| Dark Mode Overview  | `docs/assets/screenshots/promptvault-overview-dark.png`  |
| Explorer View       | `docs/assets/screenshots/promptvault-explorer.png`       |
| Analysis View       | `docs/assets/screenshots/promptvault-analysis.png`       |
| Optimizer View      | `docs/assets/screenshots/promptvault-optimizer.png`      |

---

## Release History

| Version     | Date       | Type        |
| ----------- | ---------- | ----------- |
| v1.6.0      | 2026-06-15 | Stable      |
| v1.5.0-rc.1 | 2026-06-07 | Pre-release |
| v1.5.0      | 2026-06-05 | Stable      |
| v1.4.0      | 2026-06-04 | Stable      |

---

## Next Step

- **Immediate:** Merge `feature/optimizer-placeholder-hardening` (PR #147) after Human Approval
- **Next:** Review and merge NAS folder PR (#145)
- **Governance:** Project documentation refresh completed 2026-06-19 (OpenCode 1.15.0 run)

---

## OpenCode Agent Runtime (2026-06-19)

| Check               | Result                                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version             | 1.15.0                                                                                                                                              |
| Provider            | DeepSeek (deepseek-v4-pro)                                                                                                                          |
| Agent Mode          | issue-orchestrator                                                                                                                                  |
| Available Subagents | review-agent, research-agent, compliance-agent, migration-agent, playwright-agent, architecture-agent, security-agent, documentation-agent, explore |
| Skills loaded       | github-source-of-truth, spec-driven-development, audit-trail-enforcer                                                                               |
| Working Tree        | feature/optimizer-placeholder-hardening (3 modified + 6 untracked)                                                                                  |
| gh CLI              | 2.92.0 (available)                                                                                                                                  |
| OS/Shell            | Windows 10, PowerShell 5.1                                                                                                                          |

---

## Gate Results (2026-06-19 Fresh Run)

| Gate                   | Command                       | Result                      |
| ---------------------- | ----------------------------- | --------------------------- |
| Frontend Tests         | `pnpm test`                   | 376/376 PASS (11 files)     |
| ESLint                 | `pnpm lint`                   | PASS (0 errors, 0 warnings) |
| TypeScript             | `tsc --noEmit`                | PASS (0 errors)             |
| Rust Unit Tests        | `cargo test`                  | 102/102 PASS (+1 ignored)   |
| Rust Integration Tests | `cargo test` (command_errors) | 17/17 PASS                  |
| cargo fmt              | `cargo fmt --check`           | PASS                        |
| cargo clippy           | `cargo clippy -- -D warnings` | PASS                        |
| Git diff check         | `git diff --check`            | PASS (no conflicts)         |
| CI (master, last 5)    | `gh run list`                 | 5/5 SUCCESS                 |
