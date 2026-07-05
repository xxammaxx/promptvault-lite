# Issue #199 — Implementation Plan: Local Embeddings MVP

## Status

Draft — pending owner decisions on ADR-004

## Overview

This plan defines the phased implementation of the local embeddings MVP for Issue #199. Each phase has a clear deliverable, gating criteria, and privacy constraints. No phase proceeds without owner approval for architecture decisions.

---

## Phase 0: Architecture & Owner Decision

**Deliverable:** ADR-004 reviewed and owner decisions made.

**Tasks:**
- [ ] Owner reviews ADR-004 (`/opencode/spec/adr/adr-004-local-embeddings-mvp.md`)
- [ ] Owner decides: first real provider (ONNX, Ollama, defer)
- [ ] Owner decides: vector storage approach (SQLite serialized, sqlite-vec plan, other)
- [ ] Owner decides: duplicate threshold policy
- [ ] Owner approves progression to Phase 1

**Gates:**
- ADR status updated from "Proposed" to "Accepted" with decisions recorded
- No code changes

**Privacy risk:** None — documentation only

---

## Phase 1: Feature Flag + Mock Provider Interface

**Deliverable:** Feature flag mechanism and `MockProvider` with tests.

**Files:**
- `src-tauri/src/embeddings/mod.rs` — module root
- `src-tauri/src/embeddings/provider.rs` — `EmbeddingProvider` trait + `EmbeddingModelInfo`
- `src-tauri/src/embeddings/mock.rs` — `MockProvider` implementation
- `src-tauri/src/lib.rs` — feature flag check via `std::env::var("PROMPTVAULT_EMBEDDINGS")`

**Tasks:**
- [ ] Create `embeddings/` module with feature gate check
- [ ] Define `EmbeddingProvider` trait: `embed()`, `similarity()`, `model_info()`
- [ ] Define `EmbeddingError` type
- [ ] Implement `MockProvider`: deterministic synthetic vectors from content hash
- [ ] Unit tests: MockProvider returns consistent results, similarity is correct

**Gates:**
- `cargo test --workspace` green
- `cargo clippy --workspace --all-targets -- -D warnings` green
- `cargo fmt --check --all` green
- Feature flag off: no embedding code executes

**Privacy risk:** None — mock provider has no external calls

---

## Phase 2: Database Schema + Migration

**Deliverable:** New tables `embedding_models` and `prompt_embeddings` created via migration.

**Files:**
- `src-tauri/src/database/sqlite.rs` — add migration for new tables
- `src-tauri/src/database/embeddings.rs` — new: `EmbeddingStore` CRUD operations

**Tasks:**
- [ ] Add `CREATE TABLE IF NOT EXISTS embedding_models` to migrations
- [ ] Add `CREATE TABLE IF NOT EXISTS prompt_embeddings` to migrations
- [ ] Add indexes for prompt_id, model_id, content_hash
- [ ] Implement `EmbeddingStore`: `save_model()`, `get_model()`, `save_embedding()`, `get_embedding()`, `get_all_embeddings_for_model()`, `get_embedding_by_hash()`
- [ ] Unit tests: table creation, CRUD operations, foreign key cascade

**Gates:**
- Migration runs without error on fresh DB and existing DB
- `cargo test --workspace` green
- `cargo clippy` green
- No changes to existing tables

**Privacy risk:** None — schema only

---

## Phase 3: Indexing Service

**Deliverable:** `embeddings_index()` command using mock provider.

**Files:**
- `src-tauri/src/embeddings/indexer.rs` — `EmbeddingIndexer` with `index()` and `IndexReport`

**Tasks:**
- [ ] Implement `EmbeddingIndexer::new(provider, store)`
- [ ] Implement content hash computation: `SHA-256(content || updated_at)`
- [ ] Implement sensitive prompt detection: check `hygiene.status = 'critical'` and PII/Secret artifacts
- [ ] Implement hash-based skip logic
- [ ] Implement `IndexReport` struct with counters and metadata
- [ ] Unit tests:
  - All prompts indexed on empty DB
  - Sensitive prompts skipped
  - Unchanged prompts skipped (hash match)
  - `IndexReport` counts verified
  - Error handling: DB unavailable

**Gates:**
- `cargo test --workspace` green
- `cargo clippy` green
- No real corpus content in tests (synthetic fixtures only)

**Privacy risk:** None — mock provider, synthetic fixtures

---

## Phase 4: Semantic Search

**Deliverable:** `semantic_search()` returning top-k results.

**Files:**
- `src-tauri/src/embeddings/search.rs` — `semantic_search()` and `SemanticResult`

**Tasks:**
- [ ] Implement `semantic_search(query, top_k)` → `Vec<SemanticResult>`
- [ ] Query embedding via provider
- [ ] Cosine similarity against all stored embeddings
- [ ] Sort, truncate to top_k
- [ ] Unit tests:
  - Returns expected top-k on synthetic fixtures
  - Empty corpus returns empty results
  - top_k larger than corpus returns all
  - Similarity scores are between 0.0 and 1.0

**Gates:**
- `cargo test --workspace` green
- `cargo clippy` green

**Privacy risk:** None — mock provider, synthetic fixtures

---

## Phase 5: Hybrid Search

**Deliverable:** `hybrid_search()` combining FTS5 + semantic results.

**Files:**
- `src-tauri/src/embeddings/search.rs` — add `hybrid_search()` and `HybridResult`

**Tasks:**
- [ ] Implement `hybrid_search(query, top_k)` → `Vec<HybridResult>`
- [ ] Integrate with existing `search_prompts()` (FTS5) for lexical results
- [ ] Call `semantic_search()` for semantic results
- [ ] Merge and deduplicate by prompt_id
- [ ] Compute combined score with configurable weights
- [ ] Produce `ranking_reason` string
- [ ] Unit tests:
  - Both lexical and semantic scores present
  - `combined_score` computed correctly
  - `ranking_reason` populated
  - Deduplication works

**Gates:**
- `cargo test --workspace` green
- `cargo clippy` green

**Privacy risk:** None — mock provider, synthetic fixtures

---

## Phase 6: Duplicate Detection

**Deliverable:** `detect_duplicates()` with advisory grouping.

**Files:**
- `src-tauri/src/embeddings/duplicates.rs` — `detect_duplicates()` and `DuplicateGroup`

**Tasks:**
- [ ] Implement `detect_duplicates(threshold)` → `Vec<DuplicateGroup>`
- [ ] Pairwise cosine similarity computation (optimized for small N initially)
- [ ] Group prompts above threshold
- [ ] Sanitized metadata only (no content)
- [ ] Unit tests:
  - Near-duplicate fixture detected above threshold
  - Dissimilar fixtures not grouped
  - Threshold boundary behavior
  - Empty corpus returns empty

**Gates:**
- `cargo test --workspace` green
- `cargo clippy` green
- No automatic mutation in any code path

**Privacy risk:** None — synthetic fixtures, sanitized metadata

---

## Phase 7: Prompt Improvement Helper

**Deliverable:** `suggest_improvements()` with advisory hints.

**Files:**
- `src-tauri/src/embeddings/improver.rs` — `suggest_improvements()` and `ImprovementReport`

**Tasks:**
- [ ] Implement `suggest_improvements(prompt_id)` → `ImprovementReport`
- [ ] Find semantically similar prompts
- [ ] Extract canonical sections from similar prompts
- [ ] Detect missing sections in target prompt
- [ ] Generate `SectionExample` with snippet references (no content exposure)
- [ ] Unit tests:
  - Missing sections detected from synthetic similar prompts
  - No false positives on complete prompts
  - Report is advisory only (mutations blocked at interface level)
  - Section examples reference prompt IDs, not content

**Gates:**
- `cargo test --workspace` green
- `cargo clippy` green
- No content mutations

**Privacy risk:** None — synthetic fixtures

---

## Phase 8: Documentation & Evidence

**Deliverable:** Updated docs, audit evidence, and local gates verification.

**Files:**
- `docs/audits/EMBEDDING_MVP_RUN_REPORT.md`
- `docs/audits/LOCAL_ONLY_EMBEDDINGS_AUDIT.md`
- `docs/explanation/embedding-mvp.md`
- `.opencode/evidence/` — evidence artifacts

**Tasks:**
- [ ] Create embedding MVP audit report
- [ ] Create local-only embeddings privacy audit
- [ ] Create explanation doc for embedding feature
- [ ] Update `EVIDENCE_PORTFOLIO.md`
- [ ] Run full local gate suite
- [ ] Document Windows-compatible command examples

**Gates:**
- All local gates green (test, lint, tsc, build, cargo fmt, cargo clippy, cargo test)
- No real corpus content, private paths, or file names in evidence
- No Remote-CI triggered

**Privacy risk:** Documentation and evidence files only — sanitized

---

## Dependency Graph

```
Phase 0 (Owner Decision)
    ↓
Phase 1 (Feature Flag + Mock Provider)
    ↓
Phase 2 (DB Schema + Migration)
    ↓
Phase 3 (Indexing Service)
    ↓
    ├── Phase 4 (Semantic Search)
    │       ↓
    ├── Phase 5 (Hybrid Search)
    │       ↓
    ├── Phase 6 (Duplicate Detection)
    │       ↓
    └── Phase 7 (Improvement Helper)
            ↓
Phase 8 (Docs + Evidence)
```

Phases 4-7 can be developed in parallel after Phase 3 is complete.

## Privacy Checklist per Phase

| Phase | External Calls | Real Content | Sensitive Data |
|---|---|---|---|
| 0 | None | None | None |
| 1 | None | None | None |
| 2 | None | None | None |
| 3 | None | Synthetic only | None |
| 4 | None | Synthetic only | None |
| 5 | None | Synthetic only | None |
| 6 | None | Synthetic only | None |
| 7 | None | Synthetic only | None |
| 8 | None | None | None |
