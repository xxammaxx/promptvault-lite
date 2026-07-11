# Roadmap — PromptVault Lite

**Last updated:** 2026-07-10
**Current version:** v1.7.1 (stable release)
**Next target:** v1.7.2 (Docs Sync completed via PR #208, release readiness reviewed)

---

## Completed

| Priority | Task                                   | Issue/PR | Status                          |
| -------- | -------------------------------------- | -------- | ------------------------------- |
| P0       | Optimizer Placeholder Hardening        | PR #147  | ✅ Merged (2026-06-20)          |
| P0       | Replace placeholder release icons      | #82      | ✅ Closed (2026-06-12)          |
| P0       | NAS-mounted markdown folder support    | PR #145  | ✅ Merged (2026-06-20)          |
| P0       | Blueprint Detection & Analysis         | PR #148  | ✅ Merged (2026-06-19)          |
| P0       | .txt prompt ingestion support          | PR #168  | ✅ Merged (2026-06-21)          |
| P0       | Scanner extension consolidation        | PR #170  | ✅ Merged (2026-06-21)          |
| P0       | Shared file size limit (1 MiB)         | PR #172  | ✅ Merged (2026-06-21)          |
| P0       | MkDocs Docs-as-Code                    | PR #162  | ✅ Merged (2026-06-21)          |
| P0       | Historical evidence archive            | PR #163  | ✅ Merged (2026-06-21)          |
| P0       | AGENTS.md agent rules                  | PR #160  | ✅ Merged (2026-06-20)          |
| P0       | UI/Optimizer/Classification/Layout     | PR #185  | ✅ Merged (2026-06-24)          |
| P1       | Settings Modal                         | #63      | ✅ Merged (PR #186, 2026-07-02) |
| P1       | Audio Summary (TTS via Web Speech API) | #200     | ✅ Merged (PR #202, 2026-07-03) |
| P1       | Paste Prompt Analyzer                  | #204     | ✅ Merged (PR #205, 2026-07-05) |
| P1       | Embeddings Phase 1 (Mock Provider)     | #199     | ✅ Merged (PR #206, 2026-07-06) |

---

## In Progress

| Priority | Task                                    | Issue | Status                                                     |
| -------- | --------------------------------------- | ----- | ---------------------------------------------------------- |
| P0       | Docs Baseline Sync (pre v1.7.2 release) | #207  | ✅ Completed (PR #208 merged)                              |
| P1       | v1.7.2 Release Readiness                | #209  | 🔄 Reviewed — manual owner approval required               |
| P2       | Missing-Info-Gate                       | #216  | ✅ Implemented — ready for owner review (ADR-002 accepted) |

---

## Short-Term (Next Sprints)

| Priority | Task                                   | Issue | Status                                                                                   |
| -------- | -------------------------------------- | ----- | ---------------------------------------------------------------------------------------- |
| P2       | Embeddings Phase 2: DB schema/storage  | #199  | Planned (no real provider)                                                               |
| P2       | Architecture Contract Audit            | —     | Planned                                                                                  |
| P2       | Security Posture Review                | —     | Planned                                                                                  |
| P2       | Tool-Gap Closure (mkdocs, secret scan) | —     | Planned                                                                                  |
| P2       | VariantGenerator / Direction Profiles  | #215  | ✅ Implemented — ready for owner review (Feature-Flag: `PROMPTVAULT_DIRECTION_PROFILES`) |
| P2       | Agentic Browser Repair Kit             | #71   | Planned                                                                                  |
| P2       | Prompt suggestions workflow            | #45   | Planned                                                                                  |

---

## Medium-Term

| Priority | Feature Area                       | Issues    | Status                                       |
| -------- | ---------------------------------- | --------- | -------------------------------------------- |
| P1       | Docker/LXC Web Backend Adapter MVP | #97–#142  | Deferred — large epic, no implementation yet |
| P2       | Docker Deployment                  | #126–#128 | Deferred (part of Web/LAN MVP)               |
| P2       | Web-specific UI adjustments        | #124–#125 | Deferred (part of Web/LAN MVP)               |
| P2       | Code signing for Windows installer | —         | Planned                                      |

---

## Long-Term / Deferred

- **Proxmox/NAS Integration** (#129–#131, #141–#142)
- **Security Red Tests** (#132–#136)
- **LAN Accessibility** (#137–#138)
- **Agentic Baseline Prompt** (#146)
- **Real embedding provider** (ONNX/Ollama — deferred per ADR-004 Decision C)
- **macOS/Linux native installers**

---

## Documentation Debt

| Priority | Task                         | Issue | Status                 |
| -------- | ---------------------------- | ----- | ---------------------- |
| P3       | Platform-specific INSTALL.md | #43   | Backlog                |
| P3       | Legacy docs cleanup          | #42   | Backlog                |
| P3       | Screenshots                  | #40   | Backlog                |
| P0       | Docs Baseline Sync           | #207  | ✅ Completed (PR #208) |

---

## Non-Goals (Explicitly Out of Scope)

- Cloud backend or SaaS offering
- API-based prompt optimization (stays local/deterministic)
- User accounts or authentication
- Telemetry or analytics collection
- Mobile apps
- Real-time collaboration
- Real semantic search / ML embeddings in production (Phase 1 is mock-only)
- Docker/Web/LAN production deployment (deferred)
