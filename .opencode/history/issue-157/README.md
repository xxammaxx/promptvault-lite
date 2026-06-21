# Issue #157 Historical Archive

This directory contains historical audit, evidence, agent-run, ADR, and architecture artifacts from the promptvault-lite docs-backlog cleanup (Issue #157).

These files are retained for traceability only.

**They are not current project status.**
**They are not part of the user-facing MkDocs documentation site.**

## Current Sources of Truth

- GitHub Issues and PRs
- `AGENTS.md` — Repository agent rules
- `docs/PROJECT_STATUS.md` — Current project status
- `docs/EVIDENCE_PORTFOLIO.md` — Evidence portfolio
- `docs/ROADMAP.md` — Project roadmap
- Issue #154 — Local-CI-first policy
- Issue #157 — Docs backlog closure

## Policy

- Remote-CI remains `REMOTE_CI_INFRA_BLOCKED`
- Local-CI-first remains the current quality-gate policy
- Historical files are NOT published through MkDocs
- `mkdocs.yml` excludes all historical directories

## Archive Contents

| Directory | Description | Era |
|-----------|-------------|-----|
| `audits/` | 7 project audit documents (2026-06-10/11) | Hermes/early OpenCode |
| `evidence/` | 8 evidence artifacts (2026-06-18/20) | Hermes + OpenCode |
| `agent/` | 8 agent context manifests & evidence logs (2026-06-10) | Hermes-era |
| `adr/` | ADR-002 docs-as-code platform (contains stale implementation claims) | 2026-06-10 |
| `architecture/` | Architecture overview (v1.5.0 labeled, stale details) | ~v1.5.0 era |

## Excluded from this Archive

- `docs/CANONICAL_PROMPT_STANDARD.md` — current, needs owner review (follow-up)
- `llms.txt` — stale, needs regeneration (follow-up)
