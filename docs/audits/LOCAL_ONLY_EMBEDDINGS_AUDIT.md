# Local-Only Embeddings Audit — Phase 1

## Scope

Issue [#199](https://github.com/xxammaxx/promptvault-lite/issues/199) — Local Embeddings MVP

## Audit Date

2026-07-06

---

## Phase 1 Status

**Phase 1: mock provider only.** No real embedding model, no network calls, no file access.

## Implemented

- Feature flag `PROMPTVAULT_EMBEDDINGS=1` (disabled by default)
- `EmbeddingProvider` interface (provider-agnostic contract)
- `MockEmbeddingProvider` — deterministic, synthetic, no ML dependency
- `createEmbeddingProvider()` factory with feature-flag gating
- Synthetic fixture tests only (no real corpus content)
- Provider not initialised when feature flag is disabled

## Not Implemented

| Feature                         | Status                                       |
| ------------------------------- | -------------------------------------------- |
| ONNX Runtime                    | Deferred — ADR-004 Decision C                |
| Ollama adapter                  | Deferred — ADR-004 Decision C                |
| sqlite-vec                      | Not in MVP — may evaluate in future phase    |
| External vector DB              | Rejected — ADR-004 (local-first)             |
| DB migration (embedding tables) | Phase 2 — separate owner approval            |
| Real embeddings                 | Deferred — no model in Phase 1               |
| Real corpus embeddings          | Blocked — requires owner approval + Phase 2+ |
| Cloud embedding API             | Rejected — violates Constitution §1          |
| Remote LLM                      | Rejected — violates Constitution §1          |
| Prompt auto-mutation            | Blocked — advisory output only               |
| Semantic search                 | Phase 4+ — needs DB schema first             |
| Duplicate detection             | Phase 6+ — needs DB schema + real provider   |
| Prompt improvement helper       | Phase 7+ — needs real provider               |

## Safety

| Check                           | Result |
| ------------------------------- | ------ |
| Feature disabled by default     | PASS   |
| Provider null when flag off     | PASS   |
| Mock provider: no network       | PASS   |
| Mock provider: no file I/O      | PASS   |
| Mock provider: no process spawn | PASS   |
| Mock provider: deterministic    | PASS   |
| Synthetic tests only            | PASS   |
| No prompt content in code       | PASS   |
| No private paths committed      | PASS   |
| No real file names committed    | PASS   |
| No corpus files committed       | PASS   |
| No Remote-CI triggered          | PASS   |
| Paste analyzer unchanged        | PASS   |

## Test Results

| Test Suite               | Tests | Result |
| ------------------------ | ----- | ------ |
| featureFlag.test.ts      | 16    | PASS   |
| providerContract.test.ts | 11    | PASS   |
| mockProvider.test.ts     | 22    | PASS   |

## Dependencies

**Zero new dependencies.** Pure TypeScript implementation. No npm packages, no Rust crates, no external binaries.

## Risk Assessment

- **GREEN_SAFE**: Feature-flagged, mock-only, no external calls, no mutation
- **YELLOW_REVIEW**: Future provider choice (deferred per ADR-004 Decision C)
- **RED_BLOCK**: Any attempt to add cloud API, remote LLM, or real corpus embedding without owner approval
