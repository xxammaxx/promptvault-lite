# Roadmap — PromptVault Lite

**Last updated:** 2026-06-20
**Current version:** v1.7.0-dev (master)

---

## Immediate (Current Sprint)

| Priority | Task                                    | Issue/PR | Status                           |
| -------- | --------------------------------------- | -------- | -------------------------------- |
| ~~P0~~   | ~~Optimizer Placeholder Hardening~~     | PR #147  | ✅ Done (merged 2026-06-20)      |
| ~~P0~~   | ~~Replace placeholder release icons~~   | #82      | ✅ Closed (completed 2026-06-12) |
| ~~P0~~   | ~~NAS-mounted markdown folder support~~ | #145     | ✅ Done (merged 2026-06-20)      |

---

## Short-Term (Next 2-3 Sprints)

| Priority | Task                                    | Issue | Status                              |
| -------- | --------------------------------------- | ----- | ----------------------------------- |
| P1       | Settings Modal                          | #63   | Planned                             |
| P1       | Set GitHub repository topics & homepage | —     | [APPROVAL REQUIRED]                 |
| P1       | Create first native binary release      | —     | Unblocked (#82 resolved 2026-06-12) |
| P2       | Agentic Browser Repair Kit              | #71   | Planned                             |
| P2       | Prompt suggestions workflow             | #45   | Planned                             |

---

## Medium-Term

| Priority | Feature Area                       | Issues    | Status                                          |
| -------- | ---------------------------------- | --------- | ----------------------------------------------- |
| ~~P2~~   | ~~Blueprint Detection & Analysis~~ | #49–#59   | ✅ Core detection/optimization merged (PR #148) |
| P2       | Docker Deployment                  | #126–#128 | Planned                                         |
| P2       | Web-specific UI adjustments        | #124–#125 | Planned                                         |
| P2       | macOS CI runner                    | —         | Planned                                         |

---

## Long-Term / Speckit Workstreams

Multiple speckit-labeled issues are open tracking larger feature workstreams:

- **Proxmox/NAS Integration** (#129–#131, #141–#142)
- **Security Red Tests** (#132–#136)
- **LAN Accessibility** (#137–#138)
- **Agentic Baseline Prompt** (#146)

---

## Documentation Debt

| Priority | Task                                   | Issue              |
| -------- | -------------------------------------- | ------------------ | -------------------------------- |
| P3       | Platform-specific INSTALL.md           | #43                |
| P3       | Legacy docs cleanup                    | #42                |
| ~~P0~~   | ~~AGENTS.md for OpenCode agent rules~~ | PR #160            | ✅ Committed (merged 2026-06-20) |
| P0       | Evidence Portfolio docs                | Created 2026-06-18 |
| P1       | Project Status doc                     | Created 2026-06-18 |

---

## Non-Goals (Explicitly Out of Scope)

- Cloud backend or SaaS offering
- API-based prompt optimization (stays local/deterministic)
- User accounts or authentication
- Telemetry or analytics collection
- Mobile apps
- Real-time collaboration
