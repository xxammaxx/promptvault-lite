# Implementation Plan: Typed Local Action Layer

**Issue:** #90  
**Phase:** 3 — Plan  
**Date:** 2026-06-15

---

## 1. Affected Modules & Files

### 1.1 New Files (TypeScript)

| File                                      | Purpose                                                 |
| ----------------------------------------- | ------------------------------------------------------- |
| `src/actions/registry.ts`                 | Action registry with allowlist, contracts, and dispatch |
| `src/actions/contracts.ts`                | Typed contracts (Input/Output schemas via Zod)          |
| `src/actions/handlers.ts`                 | Action handler implementations                          |
| `src/actions/evidence.ts`                 | Evidence/event log for every action call                |
| `src/actions/__tests__/contracts.test.ts` | Schema validation tests                                 |
| `src/actions/__tests__/red-tests.test.ts` | 7 Red Tests                                             |
| `src/actions/__tests__/handlers.test.ts`  | Handler unit tests                                      |
| `src/actions/index.ts`                    | Public API exports                                      |

### 1.2 New Files (Rust)

| File                                  | Purpose                            |
| ------------------------------------- | ---------------------------------- |
| `src-tauri/src/commands/actions.rs`   | Tauri commands for action dispatch |
| `src-tauri/tests/action_contracts.rs` | Rust-side contract tests           |

### 1.3 Modified Files

| File                                | Change                                                       |
| ----------------------------------- | ------------------------------------------------------------ |
| `src-tauri/src/commands/mod.rs`     | Add `pub mod actions;`                                       |
| `src-tauri/src/lib.rs`              | Register new Tauri commands                                  |
| `src-tauri/src/analysis/hygiene.rs` | Add CHAT_META, SCOPE_POLLUTION, OCR_RESIDUE detectors        |
| `src-tauri/src/models/artifact.rs`  | Add new ArtifactCategory variants                            |
| `src/types/index.ts`                | Add new types (ActionContract, ActionName, EvidenceLogEntry) |
| `src/lib/tauri.ts`                  | Add action dispatch API wrappers                             |
| `src/stores/appStore.ts`            | Add devMode flag, action dispatch integration                |

### 1.4 New Directories

| Directory               | Purpose                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `fixtures/`             | QA test fixtures (path-bounded)                                |
| `fixtures/good/`        | Well-structured prompt fixtures                                |
| `fixtures/bad/`         | Problematic prompt fixtures (scope pollution, artifacts, etc.) |
| `fixtures/__samples__/` | Sample outputs for comparison                                  |

## 2. Implementation Order (Dependency Graph)

```
Phase 1: Types & Contracts (no logic, just schemas)
  └─ src/types/index.ts (add ActionContract, EvidenceLogEntry types)
  └─ src/actions/contracts.ts (Zod schemas for all 10 actions)

Phase 2: Action Registry (no Tauri yet, just dispatch logic)
  └─ src/actions/registry.ts
  └─ src/actions/evidence.ts

Phase 3: Action Handlers (wired to existing APIs)
  └─ src/actions/handlers.ts
  └─ src/actions/index.ts

Phase 4: Rust Integration
  └─ src-tauri/src/models/artifact.rs (new categories)
  └─ src-tauri/src/analysis/hygiene.rs (new detectors)
  └─ src-tauri/src/commands/actions.rs
  └─ src-tauri/src/commands/mod.rs
  └─ src-tauri/src/lib.rs

Phase 5: Store Integration
  └─ src/stores/appStore.ts (devMode flag)
  └─ src/lib/tauri.ts (action dispatch wrappers)

Phase 6: Red Tests
  └─ src/actions/__tests__/red-tests.test.ts
  └─ src-tauri/tests/action_contracts.rs

Phase 7: Unit Tests
  └─ src/actions/__tests__/contracts.test.ts
  └─ src/actions/__tests__/handlers.test.ts

Phase 8: QA Fixtures
  └─ fixtures/ directory with sample prompts

Phase 9: CI Gates
  └─ Verify all tests pass
  └─ Verify typecheck
  └─ Verify lint

Phase 10: Documentation
  └─ Update CHANGELOG.md
  └─ Update HUMAN_QA_CHECKLIST.md
```

## 3. Key Design Decisions

### 3.1 Pure TypeScript Actions First

Actions that don't require the file system (search, get, score, detect_artifacts, optimize, collections.list, qa.compare_score) are implemented in TypeScript and call existing Tauri commands under the hood. This makes them testable with Vitest without Tauri runtime.

### 3.2 Path-Bounded QA Fixtures

`qa.load_fixture` uses a strict path sanitization:

- Remove `..` and `.` segments
- Reject paths containing `/`, `\`, or absolute path indicators
- Prepend `fixtures/` base directory
- Canonicalize result and verify it's still under `fixtures/`

### 3.3 Write Action Approval

`prompts.create` and `prompts.update` check:

1. `developerMode` flag must be true
2. Approval token/prompt shown to user
3. Action logged with full evidence before execution

### 3.4 Evidence Log

Every action call creates an evidence log entry:

```typescript
interface EvidenceLogEntry {
  timestamp: string;
  action: string;
  input_hash: string;
  result: "success" | "error" | "blocked";
  duration_ms: number;
  error?: string;
}
```

### 3.5 No New Dependencies

- Schema validation: `zod` (already in dependencies)
- No new Rust crates
- No new npm packages

## 4. Testing Strategy

| Layer               | Tool                       | Scope                                          |
| ------------------- | -------------------------- | ---------------------------------------------- |
| Contract validation | Vitest + Zod               | Schema compliance for all 10 actions           |
| Red Tests           | Vitest                     | 7 specific failure scenarios                   |
| Handler unit tests  | Vitest                     | Individual action handler logic                |
| Rust integration    | `cargo test`               | New artifact detectors, Tauri command plumbing |
| Existing regression | `cargo test` + `pnpm test` | All existing tests must pass                   |

## 5. Rollback Plan

- All new code is additive (no existing API changes)
- Action registry can be disabled via `developerMode = false` (which is the default)
- New artifact categories are additive (existing categories unchanged)
- Revert strategy: remove `src/actions/` directory, revert 5 modified files

## 6. Estimated Complexity

| Phase             | Files        | Complexity | Risk           |
| ----------------- | ------------ | ---------- | -------------- |
| Types & Contracts | 2            | Low        | Low            |
| Action Registry   | 2            | Medium     | Low            |
| Action Handlers   | 2            | Medium     | Low            |
| Rust Integration  | 5            | Medium     | Medium         |
| Store Integration | 2            | Low        | Low            |
| Red Tests         | 2            | Medium     | Low            |
| Unit Tests        | 2            | Low        | Low            |
| QA Fixtures       | 3+           | Low        | Low            |
| CI Gates          | 0            | Low        | Low            |
| Documentation     | 2            | Low        | Low            |
| **Total**         | **22 files** | **Medium** | **Low-Medium** |
