# Architecture Decisions

## ADR-001: MIT License

**Status:** Accepted

**Date:** 2026-06-13

**Decision:** PromptVault Lite uses the MIT License.

**Reason:**

- Permissive open-source license
- Low barrier for users and contributors
- Matches the intended public release model
- Compatible with the project's dependency ecosystem (Tauri, React, Vite, Zustand, Vitest are all MIT)

**Alternatives considered:**

- Apache-2.0 — permissive with explicit patent grant, but more formal than needed
- GPL-3.0 — copyleft would restrict enterprise adoption

**Consequences:**

- Anyone can use, modify, and distribute the software with minimal restrictions
- Copyright notice must be preserved in all copies
- No warranty is provided
