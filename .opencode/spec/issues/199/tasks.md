# Issue #199 — Task Breakdown: Local Embeddings MVP

## Status

Draft — pending owner decisions (ADR-004)

## Task Conventions

Each task includes:
- **Goal**: What this task achieves
- **Files**: Files to create or modify
- **Tests**: Specific test scenarios
- **Gates**: Local CI gates that must pass
- **Privacy**: Privacy risk assessment
- **Owner Gate**: Whether owner approval is needed before/after

---

## Phase 0: Architecture & Owner Decision

### T0.1 — Owner reviews ADR-004
- **Goal**: Owner reads and decides on provider, storage, and duplicate threshold
- **Files**: `.opencode/spec/adr/adr-004-local-embeddings-mvp.md`
- **Tests**: None
- **Gates**: None
- **Privacy**: None
- **Owner Gate**: Owner approval required to proceed to Phase 1

---

## Phase 1: Feature Flag + Mock Provider Interface

### T1.1 — Create embeddings module and feature flag
- **Goal**: Establish `src-tauri/src/embeddings/` module with feature gate check
- **Files**: `src-tauri/src/embeddings/mod.rs`, `src-tauri/src/lib.rs` (add env var check)
- **Tests**: Feature flag off → module not initialized
- **Gates**: `cargo test`, `cargo clippy`, `cargo fmt --check`
- **Privacy**: None
- **Owner Gate**: None

### T1.2 — Define EmbeddingProvider trait
- **Goal**: Define provider-agnostic interface
- **Files**: `src-tauri/src/embeddings/provider.rs`
- **Tests**: Trait compiles with mock implementation
- **Gates**: `cargo test`, `cargo clippy`, `cargo fmt --check`
- **Privacy**: None
- **Owner Gate**: None

### T1.3 — Implement MockProvider
- **Goal**: Deterministic synthetic embedding provider for tests
- **Files**: `src-tauri/src/embeddings/mock.rs`
- **Tests**:
  - Consistent output for same input
  - Different output for different input
  - Correct vector dimensions
  - `similarity(a, a) ≈ 1.0`
  - `similarity(a, b) < 1.0` for different a, b
- **Gates**: `cargo test`, `cargo clippy`, `cargo fmt --check`
- **Privacy**: None
- **Owner Gate**: None

### T1.4 — Register embeddings module in crate
- **Goal**: Wire module into `lib.rs`
- **Files**: `src-tauri/src/lib.rs`
- **Tests**: Module compiles and can be imported
- **Gates**: `cargo test --workspace`, `cargo clippy`, `cargo fmt --check`
- **Privacy**: None
- **Owner Gate**: None

---

## Phase 2: Database Schema + Migration

### T2.1 — Add embedding_models table migration
- **Goal**: Create `embedding_models` table via `run_migrations()`
- **Files**: `src-tauri/src/database/sqlite.rs`
- **Tests**:
  - Table exists after migration
  - UNIQUE constraint on (provider, model_name) enforced
  - Foreign key behavior correct
- **Gates**: `cargo test --workspace`, `cargo clippy`, `cargo fmt --check`
- **Privacy**: None
- **Owner Gate**: None

### T2.2 — Add prompt_embeddings table migration
- **Goal**: Create `prompt_embeddings` table with indexes
- **Files**: `src-tauri/src/database/sqlite.rs`
- **Tests**:
  - Table exists after migration
  - Indexes functional
  - ON DELETE CASCADE from prompts works
- **Gates**: `cargo test --workspace`, `cargo clippy`, `cargo fmt --check`
- **Privacy**: None
- **Owner Gate**: None

### T2.3 — Implement EmbeddingStore CRUD
- **Goal**: Database operations for embeddings
- **Files**: `src-tauri/src/database/embeddings.rs`
- **Tests**:
  - `save_model()` / `get_model()` roundtrip
  - `save_embedding()` / `get_embedding()` roundtrip
  - `get_all_embeddings_for_model()` correctness
  - `get_embedding_by_hash()` skip detection
  - Overwrite on duplicate (prompt_id, model_id)
- **Gates**: `cargo test --workspace`, `cargo clippy`, `cargo fmt --check`
- **Privacy**: None
- **Owner Gate**: None

---

## Phase 3: Indexing Service

### T3.1 — Implement content hash computation
- **Goal**: SHA-256 hash of `content || updated_at` for skip logic
- **Files**: `src-tauri/src/embeddings/indexer.rs`
- **Tests**:
  - Same content + timestamp → same hash
  - Different content → different hash
  - Empty content handled
- **Gates**: `cargo test`, `cargo clippy`, `cargo fmt --check`
- **Privacy**: None
- **Owner Gate**: None

### T3.2 — Implement sensitive prompt detection
- **Goal**: Detect prompts that should be skipped (hygiene critical, PII, secrets)
- **Files**: `src-tauri/src/embeddings/indexer.rs`
- **Tests**:
  - Hygiene critical → skipped
  - PII artifact → skipped
  - Secret artifact → skipped
  - Clean prompt → not skipped
  - Warning prompt → not skipped
- **Gates**: `cargo test`, `cargo clippy`, `cargo fmt --check`
- **Privacy**: None — synthetic fixtures
- **Owner Gate**: None

### T3.3 — Implement EmbeddingIndexer with index()
- **Goal**: Full indexing flow with report
- **Files**: `src-tauri/src/embeddings/indexer.rs`
- **Tests**:
  - Empty DB → all indexed
  - Sensitive skipped
  - Unchanged skipped (hash match)
  - IndexReport counters accurate
  - Model registered on first index
  - Error handling: DB unavailable, provider unavailable
- **Gates**: `cargo test`, `cargo clippy`, `cargo fmt --check`
- **Privacy**: None — mock provider, synthetic fixtures
- **Owner Gate**: None

---

## Phase 4: Semantic Search

### T4.1 — Implement semantic_search()
- **Goal**: Cosine similarity search returning top-k results
- **Files**: `src-tauri/src/embeddings/search.rs`
- **Tests**:
  - Synthetic fixture: known similar pair ranks high
  - Empty corpus → empty results
  - top_k > corpus → returns all
  - Similarity scores in [0.0, 1.0]
  - Results sorted descending by similarity
  - Sanitized: no content in results
- **Gates**: `cargo test`, `cargo clippy`, `cargo fmt --check`
- **Privacy**: None — mock provider, synthetic fixtures
- **Owner Gate**: None

---

## Phase 5: Hybrid Search

### T5.1 — Implement hybrid_search()
- **Goal**: Combine FTS5 lexical + semantic results
- **Files**: `src-tauri/src/embeddings/search.rs`
- **Tests**:
  - Both lexical_score and semantic_score present
  - combined_score = 0.5 * lexical + 0.5 * semantic (default weights)
  - ranking_reason populated
  - Deduplication by prompt_id
  - Result when only lexical matches exist
  - Result when only semantic matches exist
  - Configurable weight parameters
- **Gates**: `cargo test`, `cargo clippy`, `cargo fmt --check`
- **Privacy**: None — mock provider, synthetic fixtures
- **Owner Gate**: None

---

## Phase 6: Duplicate Detection

### T6.1 — Implement detect_duplicates()
- **Goal**: Advisory grouping of semantically similar prompts
- **Files**: `src-tauri/src/embeddings/duplicates.rs`
- **Tests**:
  - Near-duplicate fixture: similarity ≥ 0.90 → grouped
  - Dissimilar fixture: similarity < 0.90 → not grouped
  - Threshold boundary: exact 0.90 behavior
  - Empty corpus → empty result
  - Single prompt → empty result
  - Groups use sanitized metadata (no content)
  - No mutation triggered
- **Gates**: `cargo test`, `cargo clippy`, `cargo fmt --check`
- **Privacy**: None — synthetic fixtures, sanitized metadata
- **Owner Gate**: None

---

## Phase 7: Prompt Improvement Helper

### T7.1 — Implement suggest_improvements()
- **Goal**: Advisory missing-section hints from similar prompts
- **Files**: `src-tauri/src/embeddings/improver.rs`
- **Tests**:
  - Missing sections detected from synthetic similar prompts
  - Complete prompt → empty missing_sections
  - SectionExample references prompt IDs, not content
  - No mutation triggered
  - Error handling: prompt not found, no similar prompts
- **Gates**: `cargo test`, `cargo clippy`, `cargo fmt --check`
- **Privacy**: None — synthetic fixtures
- **Owner Gate**: None

---

## Phase 8: Documentation & Evidence

### T8.1 — Create audit report
- **Goal**: Document embedding MVP run
- **Files**: `docs/audits/EMBEDDING_MVP_RUN_REPORT.md`
- **Tests**: None
- **Gates**: Sanitized content check
- **Privacy**: No prompt content, private paths, or file names
- **Owner Gate**: None

### T8.2 — Create privacy audit
- **Goal**: Document local-only embedding privacy guarantees
- **Files**: `docs/audits/LOCAL_ONLY_EMBEDDINGS_AUDIT.md`
- **Tests**: None
- **Gates**: Sanitized content check
- **Privacy**: Documentation only
- **Owner Gate**: None

### T8.3 — Create explanation doc
- **Goal**: User-facing explanation of embedding feature
- **Files**: `docs/explanation/embedding-mvp.md`
- **Tests**: None
- **Gates**: MkDocs build check
- **Privacy**: Documentation only
- **Owner Gate**: None

### T8.4 — Final local gates verification
- **Goal**: All gates green before merge
- **Files**: None
- **Tests**: Full gate suite
- **Gates**: All: `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `cargo fmt --check --all`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo test --workspace`, `git diff --check`
- **Privacy**: None
- **Owner Gate**: Owner approval required to merge

---

## Summary: Task Count by Phase

| Phase | Task Count | Privacy Risk | External Calls |
|---|---|---|---|
| 0 (Owner Decision) | 1 | None | None |
| 1 (Feature Flag + Mock) | 4 | None | None |
| 2 (DB Schema) | 3 | None | None |
| 3 (Indexing) | 3 | None | None |
| 4 (Semantic Search) | 1 | None | None |
| 5 (Hybrid Search) | 1 | None | None |
| 6 (Duplicate Detection) | 1 | None | None |
| 7 (Improvement Helper) | 1 | None | None |
| 8 (Docs + Evidence) | 4 | Documentation only | None |
| **Total** | **19** | | |
