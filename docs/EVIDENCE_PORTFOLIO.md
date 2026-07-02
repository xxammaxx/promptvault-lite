# Evidence Portfolio — PromptVault Lite

> Living Software Portfolio. Updated with every significant agent run.
> No marketing claims — only evidence-backed facts.

**Last evidence run:** 2026-07-02 (OpenCode 1.15.0, deepseek-v4-pro / issue-orchestrator, Living Truth Mirror — Issue #187 validation)
**Blueprint detection run:** 2026-06-19 (OpenCode 1.15.0)
**Scanner extension run:** 2026-06-21 (PR #168, #170, #172 merged to master)
**Settings Modal merge:** 2026-07-02 (PR #186, closes #63 — on master, not in v1.7.1 release)
**UI/Layout/Optimizer fixes:** 2026-06-24 (PR #185 merged to master)
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

| Capability                                      | PR/Issue | Status                                                 |
| ----------------------------------------------- | -------- | ------------------------------------------------------ |
| NAS-mounted markdown folder scanning            | #145     | ✅ Merged (2026-06-20)                                 |
| Optimizer placeholder hardening                 | #147     | ✅ Merged (2026-06-20)                                 |
| Blueprint detection, evaluation & optimization  | #148     | ✅ Merged (2026-06-19)                                 |
| Native .txt prompt ingestion                    | #168     | ✅ Merged (2026-06-21)                                 |
| Centralized scanner extension handling          | #170     | ✅ Merged (2026-06-21)                                 |
| Shared file size limit (1 MiB)                  | #172     | ✅ Merged (2026-06-21)                                 |
| Real prompt corpus pilot (Z-drive)              | #166     | ✅ Completed; corpus review finalized (0 open reviews) |
| Docs-as-Code MkDocs platform                    | #162     | ✅ Merged (2026-06-21)                                 |
| Historical evidence archive                     | #163     | ✅ Merged (2026-06-21)                                 |
| UI/Optimizer/Classification/Layout fixes        | #185     | ✅ Merged (2026-06-24) — on master, not in v1.7.1      |
| Settings Modal (theme, export, dev mode, reset) | #186     | ✅ Merged (2026-07-02) — on master, closes #63         |
| Five-file Playwright evidence (sanitized)       | #187     | ✅ Validated (2026-07-02) — GitHub-visible, no prompts |

---

## Issue #187 — Five-File Sanitized Playwright Evidence

**Status:** FIVE_MD_EVIDENCE_VALIDATED_AFTER_TEST_FIX_GITHUB_VISIBLE

On 2026-07-02, a Playwright smoke test was performed using 5 `.md` files from the local owner prompt folder. Results were sanitized and posted to GitHub Issue #187.

| Check                         | Result                       |
| ----------------------------- | ---------------------------- |
| App shell loads               | ✅                           |
| 5/5 files visible in Explorer | ✅                           |
| 5/5 detail panels visible     | ✅                           |
| Classification labels visible | ⚠️ 3/5 show label, 2/5 empty |
| Analysis/reasons visible      | ✅ 4/5                       |
| Optimizer tested on 2 files   | ✅                           |
| Settings modal opens          | ✅                           |
| Console errors                | 0 (clean)                    |
| Network outside localhost     | 0 (clean)                    |

**Important:** This is a five-file smoke test — it does NOT prove full 188-file corpus quality. The full corpus run remains pending. Classification label gaps noted for `agent_prompt_candidate` category; score labels empty across all files in this run.

**Safety:** No prompt contents, private paths, real file names, or screenshots were published. Only sanitized aggregate results (safe IDs, buckets, sizes, signal counts) are visible on GitHub.

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

## Issue #166 — Corpus Review Status (2026-06-22)

| Category                           | Count | Decision                                                   |
| ---------------------------------- | ----: | ---------------------------------------------------------- |
| LIKELY_FALSE_POSITIVE_TEMPLATE     |    63 | ALLOW_IMPORT                                               |
| LIKELY_FALSE_POSITIVE_ARCHITECTURE |     9 | ALLOW_IMPORT                                               |
| POSSIBLE_SECRET_REFERENCE          |    41 | ALLOW_IMPORT                                               |
| POSSIBLE_REAL_SECRET               |     5 | ALLOW_IMPORT_REDACTED (3) / EXCLUDE (1) / ALLOW_IMPORT (1) |

- Dry-run: 72 files copied and text-validated (0 binary, 0 errors)
- Corpus review finalized: 114 ALLOW_IMPORT + 3 ALLOW_IMPORT_REDACTED + 1 EXCLUDE. Open reviews: 0.
- Import execution deferred pending owner approval.

## Unchanged Limitations

| Limitation                                       | Since  | Notes                                |
| ------------------------------------------------ | ------ | ------------------------------------ |
| Windows installer unsigned (SmartScreen warning) | v1.7.1 | No code signing certificate          |
| Linux-only CI                                    | v1.0   | No macOS/Windows runners             |
| Placeholder release icons                        | v1.0   | #82 closed as completed (2026-06-12) |
| Repository visibility                            | v1.7.1 | Public (made public 2026-06-23)      |
| No Docker deployment                             | v1.0   | Issues #126–128 open                 |

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

- **Done:** Corpus pilot scan completed (Issue #166 closed 2026-06-23). Review finalized (0 open reviews): 114 ALLOW_IMPORT + 3 ALLOW_IMPORT_REDACTED + 1 EXCLUDE. Import execution deferred.
- **Done:** CANONICAL_PROMPT_STANDARD.md reviewed and archived to `.opencode/history/issue-165/` (Issue #165 closed 2026-06-23).
- **Done:** Settings Modal merged (PR #186, 2026-07-02) — on master, not in v1.7.1 release.
- **Done:** Five-file Playwright evidence validated (Issue #187, 2026-07-02) — sanitized, GitHub-visible.
- **Deferred:** Web/LAN Backend Adapter MVP (Issues #97–#142), P3 documentation (#40, #42, #43)
- **Pending:** Full 188-file corpus classification/optimizer validation.
- **Pending:** Investigate classification label gap for `agent_prompt_candidate`. Investigate score label display in web mode.

---

## OpenCode Agent Runtime (2026-07-02)

| Check               | Result                                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version             | 1.15.0                                                                                                                                              |
| Provider            | DeepSeek (deepseek-v4-pro)                                                                                                                          |
| Agent Mode          | issue-orchestrator                                                                                                                                  |
| Available Subagents | review-agent, research-agent, compliance-agent, migration-agent, playwright-agent, architecture-agent, security-agent, documentation-agent, explore |
| Skills loaded       | github-source-of-truth, spec-driven-development, audit-trail-enforcer, read-before-sketch                                                           |
| Working Tree        | master (2026-07-02: clean)                                                                                                                          |
| gh CLI              | 2.45.0 (available)                                                                                                                                  |
| OS/Shell            | Linux (Ubuntu), bash                                                                                                                                |
| Rust                | 1.95.0                                                                                                                                              |
| Node                | v22.22.0                                                                                                                                            |

---

## Gate Results (2026-07-02 Fresh Run)

| Gate                       | Command                       | Result                       |
| -------------------------- | ----------------------------- | ---------------------------- |
| Frontend Tests             | `pnpm test`                   | 634/634 PASS (26 files)      |
| ESLint                     | `pnpm lint`                   | PASS (0 errors, 0 warnings)  |
| TypeScript                 | `tsc --noEmit`                | PASS (0 errors)              |
| Rust Unit Tests            | `cargo test --lib`            | 134/134 PASS (+1 ignored)    |
| Rust Integration Tests     | `cargo test --test "*"`       | 17/17 PASS                   |
| cargo fmt                  | `cargo fmt --check --all`     | PASS                         |
| cargo clippy               | `cargo clippy -- -D warnings` | PASS (0 warnings)            |
| Git diff check             | `git diff --check`            | PASS (no conflicts)          |
| MkDocs build               | `mkdocs build --strict`       | TOOL_MISSING (not installed) |
| pnpm build                 | `pnpm build`                  | PASS                         |
| Local CI (9/10 gates)      | —                             | 9/10 PASS (mkdocs excluded)  |
| Remote CI (GitHub Actions) | `gh run list`                 | REMOTE_CI_INFRA_BLOCKED      |
