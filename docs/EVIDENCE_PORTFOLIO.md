# Evidence Portfolio — PromptVault Lite

> Living Software Portfolio. Updated with every significant agent run.
> No marketing claims — only evidence-backed facts.

**Last evidence run:** 2026-06-22 (OpenCode 1.15.0, deepseek-v4-pro / issue-orchestrator, Project Completion RC Run)
**Blueprint detection run:** 2026-06-19 (OpenCode 1.15.0)
**Scanner extension run:** 2026-06-21 (PR #168, #170, #172 merged to master)
**CodeRabbit removal run:** 2026-06-19 — confirmed: zero CodeRabbit files/references in repo

---

## Current Capabilities (Evidence-Backed)

| Capability                                                           | Evidence                               | Last Verified |
| -------------------------------------------------------------------- | -------------------------------------- | ------------- |
| Recursive .md/.markdown/.txt file scanning with Windows path support | 40 Rust tests PASS                     | 2026-06-22    |
| Shared 1 MiB file size limit for all supported prompt extensions     | 4 Rust tests PASS                      | 2026-06-22    |
| YAML frontmatter parsing (UTF-8, special chars)                      | 11 Rust tests PASS                     | 2026-06-19    |
| Quality scoring (10 criteria, multi-language)                        | 17 Rust tests + 67 frontend tests PASS | 2026-06-19    |
| Hygiene detection (18 artifact categories)                           | 27 Rust tests PASS                     | 2026-06-19    |
| Prompt optimization (3 modes, deterministic)                         | 54 frontend tests PASS                 | 2026-06-19    |
| Dark mode (auto-detect, localStorage persist)                        | 10 frontend tests PASS                 | 2026-06-19    |
| File tree with search, filter, favorites                             | 50 frontend tests PASS                 | 2026-06-19    |
| Export (JSON, Markdown, ZIP) with path safety                        | 10 Rust tests PASS                     | 2026-06-19    |
| Typed local action layer (13 actions)                                | 44 frontend tests PASS                 | 2026-06-19    |
| Blueprint detection & classification (7 classes)                     | 35 frontend tests PASS                 | 2026-06-19    |
| Blueprint quality evaluation (10 dimensions)                         | 35 frontend tests PASS                 | 2026-06-19    |
| Blueprint optimization (3 modes, conservative/balanced/aggressive)   | 35 frontend tests PASS                 | 2026-06-19    |
| Blueprint contamination detection (foreign apps, stale, secrets)     | 35 frontend tests PASS                 | 2026-06-19    |
| Tauri IPC command layer                                              | 17 Rust integration tests PASS         | 2026-06-19    |
| SQLite/FTS5 database layer                                           | 14 Rust tests PASS                     | 2026-06-19    |
| Symlink containment & path traversal protection                      | 10 Rust tests PASS                     | 2026-06-19    |
| CI: Frontend (tsc+lint+test+build)                                   | Local CI — PASS (see #154)             | 2026-06-20    |
| CI: Rust (fmt+clippy+test+build)                                     | Local CI — PASS (see #154)             | 2026-06-20    |
| CI: Secret Scan                                                      | NOT_RUN_TOOL_MISSING (local)           | 2026-06-20    |

---

## New Capabilities Since v1.6.0

| Capability                                     | PR/Issue | Status                                 |
| ---------------------------------------------- | -------- | -------------------------------------- |
| NAS-mounted markdown folder scanning           | #145     | ✅ Merged (2026-06-20)                 |
| Optimizer placeholder hardening                | #147     | ✅ Merged (2026-06-20)                 |
| Blueprint detection, evaluation & optimization | #148     | ✅ Merged (2026-06-19)                 |
| Native .txt prompt ingestion                   | #168     | ✅ Merged (2026-06-21)                 |
| Centralized scanner extension handling         | #170     | ✅ Merged (2026-06-21)                 |
| Shared file size limit (1 MiB)                 | #172     | ✅ Merged (2026-06-21)                 |
| Real prompt corpus pilot (Z-drive)             | #166     | ✅ Completed; sensitive review pending |
| Docs-as-Code MkDocs platform                   | #162     | ✅ Merged (2026-06-21)                 |
| Historical evidence archive                    | #163     | ✅ Merged (2026-06-21)                 |

---

## Removed Blockers

| Blocker                                | Resolution | When   |
| -------------------------------------- | ---------- | ------ |
| pnpm v9 workspace error in CI          | #79        | v1.6.0 |
| Ubuntu 24.04 apt conflict              | #79        | v1.6.0 |
| Tauri icon build blocker               | #81        | v1.6.0 |
| Evaluation corpus calibration failures | #94        | v1.6.0 |

---

## External Review Automation Status

| Automation   | Status                                | Notes                                                                                          |
| ------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| CodeRabbit   | REMOVED from active repo (2026-06-19) | Zero repo-level files/configs. GitHub App at org level — uninstall via Settings → GitHub Apps. |
| review-agent | ACTIVE (OpenCode subagent)            | Delegated code review, read-only.                                                              |

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

- **Immediate:** Owner review of 118 sensitive-flagged corpus files (Issue #166)
- **Next:** Owner decision on `docs/CANONICAL_PROMPT_STANDARD.md` (Issue #165)
- **Deferred:** Web/LAN Backend Adapter MVP (Issues #97–#142), P3 documentation (#40, #42, #43)
- **Governance:** Project completion RC review (2026-06-22 OpenCode 1.15.0 run)

---

## OpenCode Agent Runtime (2026-06-22)

| Check               | Result                                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version             | 1.15.0                                                                                                                                              |
| Provider            | DeepSeek (deepseek-v4-pro)                                                                                                                          |
| Agent Mode          | issue-orchestrator                                                                                                                                  |
| Available Subagents | review-agent, research-agent, compliance-agent, migration-agent, playwright-agent, architecture-agent, security-agent, documentation-agent, explore |
| Skills loaded       | github-source-of-truth, spec-driven-development, audit-trail-enforcer                                                                               |
| Working Tree        | master (clean, 2 untracked: llms.txt, docs/CANONICAL_PROMPT_STANDARD.md)                                                                            |
| gh CLI              | 2.92.0 (available)                                                                                                                                  |
| OS/Shell            | Windows 10, PowerShell 5.1                                                                                                                          |
| Rust                | 1.94.0                                                                                                                                              |
| Node                | v24.14.0                                                                                                                                            |

---

## Gate Results (2026-06-22 Fresh Run)

| Gate                       | Command                       | Result                      |
| -------------------------- | ----------------------------- | --------------------------- |
| Frontend Tests             | `pnpm test`                   | 650/650 PASS (22 files)     |
| ESLint                     | `pnpm lint`                   | PASS (0 errors, 0 warnings) |
| TypeScript                 | `tsc --noEmit`                | PASS (0 errors)             |
| Rust Unit Tests            | `cargo test --lib`            | 134/134 PASS (+1 ignored)   |
| Rust Integration Tests     | `cargo test --test "*"`       | 17/17 PASS                  |
| cargo fmt                  | `cargo fmt --check --all`     | PASS                        |
| cargo clippy               | `cargo clippy -- -D warnings` | PASS (0 warnings)           |
| Git diff check             | `git diff --check`            | PASS (no conflicts)         |
| MkDocs build               | `mkdocs build --strict`       | PASS                        |
| pnpm build                 | `pnpm build`                  | PASS                        |
| Local CI (10 gates)        | —                             | 10/10 PASS                  |
| Remote CI (GitHub Actions) | `gh run list`                 | REMOTE_CI_INFRA_BLOCKED     |
