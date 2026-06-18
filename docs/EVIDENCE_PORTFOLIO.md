# Evidence Portfolio — PromptVault Lite

> Living Software Portfolio. Updated with every significant agent run.
> No marketing claims — only evidence-backed facts.

**Last evidence run:** 2026-06-18 (Hermes v0.16.0, deepseek-v4-pro)

---

## Current Capabilities (Evidence-Backed)

| Capability | Evidence | Last Verified |
|------------|----------|---------------|
| Recursive .md file scanning with Windows path support | 13 Rust tests PASS | 2026-06-18 |
| YAML frontmatter parsing (UTF-8, special chars) | 11 Rust tests PASS | 2026-06-18 |
| Quality scoring (10 criteria, multi-language) | 17 Rust tests + 67 frontend tests PASS | 2026-06-18 |
| Hygiene detection (18 artifact categories) | 25 Rust tests PASS | 2026-06-18 |
| Prompt optimization (3 modes, deterministic) | 54 frontend tests PASS | 2026-06-18 |
| Dark mode (auto-detect, localStorage persist) | 10 frontend tests PASS | 2026-06-18 |
| File tree with search, filter, favorites | 50 frontend tests PASS | 2026-06-18 |
| Export (JSON, Markdown, ZIP) with path safety | 10 Rust tests PASS | 2026-06-18 |
| Typed local action layer (10 actions) | 44 frontend tests PASS | 2026-06-18 |
| Tauri IPC command layer | 17 Rust integration tests PASS | 2026-06-18 |
| SQLite/FTS5 database layer | 14 Rust tests PASS | 2026-06-18 |
| Symlink containment & path traversal protection | 10 Rust tests PASS | 2026-06-18 |
| CI: Frontend (tsc+lint+test+build) | GitHub Actions — PASS | 2026-06-18 |
| CI: Rust (fmt+clippy+test+build) | GitHub Actions — PASS | 2026-06-18 |
| CI: Secret Scan | GitHub Actions — PASS | 2026-06-18 |

---

## New Capabilities Since v1.6.0

| Capability | PR/Issue | Status |
|------------|----------|--------|
| NAS-mounted markdown folder scanning | #145 | In PR review |
| Optimizer placeholder hardening | Current branch | Review-ready (2026-06-18) |

---

## Removed Blockers

| Blocker | Resolution | When |
|---------|-----------|------|
| pnpm v9 workspace error in CI | #79 | v1.6.0 |
| Ubuntu 24.04 apt conflict | #79 | v1.6.0 |
| Tauri icon build blocker | #81 | v1.6.0 |
| Evaluation corpus calibration failures | #94 | v1.6.0 |

---

## Unchanged Limitations

| Limitation | Since | Notes |
|------------|-------|-------|
| Source-only release (no native binaries) | v1.0 | No binary build pipeline yet |
| Linux-only CI | v1.0 | No macOS/Windows runners |
| Placeholder release icons | v1.0 | #82 closed as completed (2026-06-12) |
| Private GitHub repository | v1.0 | Not publicly visible |
| No Docker deployment | v1.0 | Issues #126–128 open |

---

## Screenshot Evidence

| Screenshot | File |
|------------|------|
| Light Mode Overview | `docs/assets/screenshots/promptvault-overview-light.png` |
| Dark Mode Overview | `docs/assets/screenshots/promptvault-overview-dark.png` |
| Explorer View | `docs/assets/screenshots/promptvault-explorer.png` |
| Analysis View | `docs/assets/screenshots/promptvault-analysis.png` |
| Optimizer View | `docs/assets/screenshots/promptvault-optimizer.png` |

---

## Release History

| Version | Date | Type |
|---------|------|------|
| v1.6.0 | 2026-06-15 | Stable |
| v1.5.0-rc.1 | 2026-06-07 | Pre-release |
| v1.5.0 | 2026-06-05 | Stable |
| v1.4.0 | 2026-06-04 | Stable |

---

## Next Step

Optimizer placeholder hardening is review-ready. Next: merge to master, then address #82 (release icons) to unblock first production binary release.
