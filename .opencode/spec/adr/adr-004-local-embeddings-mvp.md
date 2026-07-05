# ADR-004: Local Embeddings MVP

## Status

Proposed (Needs Owner Decision)

## Context

PromptVault Lite currently performs all analysis with a rule-based engine (ADR-003). It already has:

- SQLite-backed storage with FTS5 virtual table for full-text search (ADR-002)
- Prompt classification (`ContentClass`: PROMPT, BLUEPRINT, HYBRID, etc.)
- Quality scoring (10 rule-based criteria + 7 guideline-specific criteria)
- Hygiene analysis (18 artifact categories including PII and Secret detection)
- Deterministic prompt optimizer with canonical section reordering
- Local-first architecture — no network calls for core functions (Constitution §1)

Issue #199 proposes adding an optional, local-only embedding layer for:

1. **Semantic search** — similarity-based retrieval beyond keyword/FTS5
2. **Duplicate detection** — advisory grouping of semantically similar prompts
3. **Prompt improvement helper** — checks for missing canonical sections referenced in similar prompts

The existing lexical/FTS5 search and rule-based analysis remain the primary, explainable layer. Embeddings provide an additive, advisory layer.

## Decision Drivers

1. **Local-first by default** (Constitution §1) — no cloud embedding APIs, no remote LLMs, no telemetry
2. **Feature-gated** (disabled by default) — `PROMPTVAULT_EMBEDDINGS=1`; existing behavior unchanged when off
3. **Sensitive content protection** — prompts with hygiene status `Critical` or containing PII/Secret artifacts skipped by default
4. **Advisory output only** — no automatic prompt mutation, deletion, or merging
5. **No new runtime dependency** for MVP — avoid Python sidecars, external vector DBs, or model downloads
6. **Schema safe** — new tables alongside existing schema; no changes to existing tables
7. **Content hashing** — skip re-indexing unchanged prompts using a SHA-256 hash of content + metadata
8. **Explainable results** — hybrid search exposes lexical_score, semantic_score, combined_score, and ranking reason

## Proposed MVP Decision

### Provider: Mock/Synthetic First, Real Adapter Later

**Phase 1 (this ADR's scope):** Mock/synthetic embedding provider for test fixtures and interface design.

**Phase 2 (separate owner approval required):** Real local embedding provider behind feature flag. Candidates:

| Provider | Assessment |
|----------|------------|
| ONNX Runtime (e.g., all-MiniLM-L6-v2) | Pure Rust/ONNX; no external process; true local-first; currently no Rust crate dependency. |
| Ollama `/api/embed` | Local HTTP; requires Ollama runtime; simple adapter; user must install separately. |
| SentenceTransformers / Python sidecar | Maximum flexibility; adds Python packaging complexity; not suitable for MVP. |

**Recommendation:** Defer real provider decision. Design the `EmbeddingProvider` trait to be provider-agnostic. Implement a `MockProvider` in Phase 1 for tests. Evaluate ONNX Runtime as the first real provider candidate (true local-first, no external process).

### Storage: SQLite Serialized Vectors

**Phase 1:** Use existing SQLite with new tables storing vectors as BLOB or JSON-serialized arrays. No new Rust crate dependency.

**New tables:**

```sql
CREATE TABLE IF NOT EXISTS embedding_models (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    dimensions INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    UNIQUE(provider, model_name)
);

CREATE TABLE IF NOT EXISTS prompt_embeddings (
    prompt_id TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    model_id TEXT NOT NULL REFERENCES embedding_models(id) ON DELETE CASCADE,
    content_hash TEXT NOT NULL,
    vector_blob TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (prompt_id, model_id)
);

CREATE INDEX IF NOT EXISTS idx_embedding_prompt ON prompt_embeddings(prompt_id);
CREATE INDEX IF NOT EXISTS idx_embedding_model ON prompt_embeddings(model_id);
CREATE INDEX IF NOT EXISTS idx_embedding_hash ON prompt_embeddings(content_hash);
```

**Phase 2+ (separate owner approval):** Evaluate `sqlite-vec` extension for efficient ANN (approximate nearest neighbor) search. Requires packaging review for Windows/Linux/macOS.

**Not considered for MVP:** External vector databases (Qdrant, Chroma) — violate local-first simplicity and add operational complexity.

### Indexing: Explicit, Hash-Based, Sensitive-Skip

- Feature flag `PROMPTVAULT_EMBEDDINGS=1` must be set
- Indexing triggered by explicit user/CLI/UI command only
- Content hash (SHA-256 of `content` + `updated_at`) determines if re-indexing needed
- Prompts with `HygieneStatus::Critical` OR containing `ArtifactCategory::Pii`/`ArtifactCategory::Secret` skipped by default
- Structured indexing report: `indexed`, `skipped_sensitive`, `skipped_unchanged`, `failed`, model/provider used

### Semantic Search: Additive Layer

- `semantic_search(query, top_k)` returns ranked results with similarity scores
- Results include sanitized metadata: prompt title, category, version, score (no content)
- Semantic search never replaces lexical/FTS5 search; it is an additional filter mode

### Hybrid Search: Combined Scoring

- Returns both lexical (FTS5) and semantic results with individual scores
- `combined_score = w_lexical * lexical_score + w_semantic * semantic_score` (configurable weights)
- Result metadata: `lexical_score`, `semantic_score`, `combined_score`, `ranking_reason`
- Ranking must be explainable and reviewable

### Duplicate Detection: Advisory Only

- Cosine similarity threshold: configurable, default 0.90
- Groups likely duplicates/near-duplicates
- No automatic deletion, merging, or content modification
- Report uses sanitized metadata only (no content exposure)

### Prompt Improvement Helper: Missing-Section Hints

- For a selected prompt, finds semantically similar prompts
- Reports missing canonical sections (e.g., "Goal definition", "Input variables", "Output format")
- Advisory only — no automatic content rewrite or save
- Generated hints must be deterministic for the same input

## Alternatives Considered

### sqlite-vec for Vector Search
Adds native vector similarity operations to SQLite. Better ANN performance for large corpora. Requires build integration and platform testing for Windows. Deferred to Phase 2+ after packaging review.

### External Vector Database (Qdrant, Chroma, etc.)
Best ANN performance at scale. Adds separate service requirement, operational complexity, and deployment burden. Overkill for local desktop MVP. **Rejected** for violating local-first simplicity.

### SentenceTransformers / Python Sidecar
Flexible model selection. Adds Python runtime requirement, packaging complexity, and cross-platform support burden. **Deferred** — may be considered as an optional provider adapter later.

### Cloud Embedding APIs (OpenAI, Cohere, etc.)
Requires network calls and sends prompt content to third parties. **Rejected** — violates Constitution §1 (local & data privacy) and Issue #199 hard constraints.

## Consequences

### Positive

- Minimal risk: mock provider first, feature flag off by default, no automatic mutation
- Local-first preserved: all embedding and search stays on-device
- Schema-safe: new tables only, no alteration to existing schema
- Good testability: synthetic fixtures, deterministic mock provider, hash-based skip
- Gradual adoption path: mock → ONNX → optional Ollama/sidecar adapters

### Negative

- Initial vector search may be slower (O(n) cosine similarity vs ANN)
- Real semantic quality depends on later provider selection
- Performance optimization may require sqlite-vec or similar extension later
- No real semantic value until a real provider is selected and integrated

## Owner Decisions Needed

### Decision 1: First Real Provider
- [ ] **A) ONNX Runtime** (all-MiniLM-L6-v2 or similar) — true local-first, Rust/ONNX, no external process
- [ ] **B) Ollama local adapter** (`/api/embed`) — requires separate Ollama install, simple HTTP adapter
- [ ] **C) Defer real provider** — ship mock-only first, decide after mock integration tests

### Decision 2: Vector Storage
- [ ] **A) SQLite serialized vectors (BLOB/JSON)** — for MVP; evaluate sqlite-vec later
- [ ] **B) Plan for sqlite-vec now** — include as Phase 2 dependency after packaging review
- [ ] **C) Other local vector store** — specify

### Decision 3: Duplicate Detection Threshold
- [ ] **A) Fixed initial threshold** (e.g., cosine ≥ 0.90) — implemented as constant
- [ ] **B) User-configurable threshold** — exposed in settings UI
- [ ] **C) Report-only threshold** — no configuration, just grouping display

## Safety

- No prompt contents in public evidence or ADR artifacts
- No private paths or real file names exposed
- No corpus embedding without explicit owner approval
- No cloud embedding API or remote LLM dependency
- No automatic prompt mutation, deletion, or merging
- No Remote-CI triggered
- No new Cargo/npm dependencies introduced by this ADR

## References

- ADR-002: Data Persistence (SQLite + FTS5)
- ADR-003: Analysis Engine (rule-based, deferred ML)
- Constitution §1: Local & Data Privacy
- Issue #199: feat(embeddings): add optional local semantic search and prompt intelligence MVP
