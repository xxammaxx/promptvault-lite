# Roadmap — PromptVault Lite

**Last updated:** 2026-06-24
**Current version:** v1.7.1 (master)

---

## Completed (Since v1.6.0)

| Priority | Task                                    | Issue/PR | Status                           |
| -------- | --------------------------------------- | -------- | -------------------------------- |
| ~~P0~~   | ~~Optimizer Placeholder Hardening~~     | PR #147  | ✅ Merged (2026-06-20)           |
| ~~P0~~   | ~~Replace placeholder release icons~~   | #82      | ✅ Closed (completed 2026-06-12) |
| ~~P0~~   | ~~NAS-mounted markdown folder support~~ | PR #145  | ✅ Merged (2026-06-20)           |
| ~~P0~~   | ~~Blueprint Detection & Analysis~~      | PR #148  | ✅ Merged (2026-06-19)           |
| ~~P0~~   | ~~.txt prompt ingestion support~~       | PR #168  | ✅ Merged (2026-06-21)           |
| ~~P0~~   | ~~Scanner extension consolidation~~     | PR #170  | ✅ Merged (2026-06-21)           |
| ~~P0~~   | ~~Shared file size limit (1 MiB)~~      | PR #172  | ✅ Merged (2026-06-21)           |
| ~~P0~~   | ~~MkDocs Docs-as-Code~~                 | PR #162  | ✅ Merged (2026-06-21)           |
| ~~P0~~   | ~~Historical evidence archive~~         | PR #163  | ✅ Merged (2026-06-21)           |
| ~~P0~~   | ~~AGENTS.md agent rules~~               | PR #160  | ✅ Merged (2026-06-20)           |

---

## Short-Term (Next 2-3 Sprints)

| Priority | Task                                    | Issue | Status                                                           |
| -------- | --------------------------------------- | ----- | ---------------------------------------------------------------- |
| P1       | Settings Modal                          | #63   | Planned                                                          |
| P1       | Set GitHub repository topics & homepage | —     | [APPROVAL REQUIRED]                                              |
| ~~P1~~   | ~~Create first native binary release~~  | —     | ✅ Done — v1.7.1 Windows x64 NSIS installer published (unsigned) |
| P2       | Agentic Browser Repair Kit              | #71   | Planned                                                          |
| P2       | Prompt suggestions workflow             | #45   | Planned                                                          |

---

## Medium-Term

| Priority | Feature Area                       | Issues    | Status                                                     |
| -------- | ---------------------------------- | --------- | ---------------------------------------------------------- |
| ~~P2~~   | ~~Blueprint Detection & Analysis~~ | #49–#59   | ✅ Core merged (PR #148); subtask issues deferred          |
| P1       | Docker/LXC Web Backend Adapter MVP | #97–#142  | Deferred after release — large epic, no implementation yet |
| P2       | Docker Deployment                  | #126–#128 | Deferred (part of Web/LAN MVP)                             |
| P2       | Web-specific UI adjustments        | #124–#125 | Deferred (part of Web/LAN MVP)                             |
| P2       | Settings Modal                     | #63       | Planned                                                    |
| P2       | Agentic Browser Repair Kit         | #71       | Planned                                                    |
| P2       | Prompt suggestions workflow        | #45       | Planned                                                    |

---

## Long-Term / Speckit Workstreams

Multiple speckit-labeled issues are open tracking larger feature workstreams:

- **Proxmox/NAS Integration** (#129–#131, #141–#142)
- **Security Red Tests** (#132–#136)
- **LAN Accessibility** (#137–#138)
- **Agentic Baseline Prompt** (#146)

---

## Documentation Debt

| Priority | Task                                   | Issue              | Status                                                          |
| -------- | -------------------------------------- | ------------------ | --------------------------------------------------------------- |
| P3       | Platform-specific INSTALL.md           | #43                | Backlog                                                         |
| P3       | Legacy docs cleanup                    | #42                | Backlog                                                         |
| P3       | Screenshots                            | #40                | Backlog                                                         |
| ~~P0~~   | ~~AGENTS.md for OpenCode agent rules~~ | PR #160            | ✅ Merged (2026-06-20)                                          |
| P0       | Evidence Portfolio docs                | Created 2026-06-18 | ✅ Updated 2026-06-22                                           |
| P1       | Project Status doc                     | Created 2026-06-18 | ✅ Updated 2026-06-22                                           |
| P0       | Regenerate llms.txt                    | #164               | ✅ Closed (2026-06-22)                                          |
| P0       | Review CANONICAL_PROMPT_STANDARD.md    | #165               | ✅ Closed — archived to .opencode/history/issue-165/            |
| P0       | Corpus sensitive-file review           | #166               | ✅ Pilot & review completed (118 files decided, 0 open reviews) |

---

## Non-Goals (Explicitly Out of Scope)

- Cloud backend or SaaS offering
- API-based prompt optimization (stays local/deterministic)
- User accounts or authentication
- Telemetry or analytics collection
- Mobile apps
- Real-time collaboration
