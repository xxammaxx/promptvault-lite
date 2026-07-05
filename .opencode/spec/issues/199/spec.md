# Issue #199 — Speckit Specification: Local Embeddings MVP

## Status

Draft — pending ADR owner decisions (ADR-004)

## Goals

1. Add optional, feature-gated local semantic search for prompts
2. Detect semantically similar prompts and report likely duplicates (advisory only)
3. Provide a prompt improvement helper that suggests missing canonical sections based on similar prompts
4. Keep existing lexical/FTS5 search and rule-based analysis as the primary, explainable layer
5. All embedding results are advisory — no automatic prompt mutation

## Non-Goals

- No cloud embedding APIs (OpenAI, Cohere, etc.)
- No remote LLM dependency
- No telemetry or tracking code
- No automatic prompt overwrite, deletion, or merging
- No embedding of sensitive/private corpus content unless explicitly owner-approved and sanitized
- No large external vector database server requirement
- No GitHub Actions/Remote-CI changes
- No auto-indexing — indexing is explicit only

## Hard Constraints

| Constraint | Detail |
|---|---|
| Feature flag | `PROMPTVAULT_EMBEDDINGS=1` — disabled by default |
| Existing behavior | Unchanged when feature flag is off |
| Local-first | All embedding and search stays on-device |
| Cross-platform | Windows 10 (PowerShell 5.1), Linux, macOS |
| Sensitive skip | Prompts with `HygieneStatus::Critical` or PII/Secret artifacts skipped by default |
| No auto mutation | Embedding results advisory only; no auto-rewrite, merge, or delete |
| Schema safe | New tables only; no changes to existing `prompts`, `evaluations`, `hygiene` schemas |
| Content hashing | SHA-256 of content + updated_at for skip logic |
| Testability | Synthetic fixtures for all embedding operations |
| Privacy | No prompt contents, private paths, or real file names in evidence |

## Provider Interface

```rust
/// Embedding provider trait — provider-agnostic.
/// Mock implementation for tests; real implementations behind feature flag.
pub trait EmbeddingProvider: Send + Sync {
    /// Generate embedding vector for a text input.
    fn embed(&self, text: &str) -> Result<Vec<f32>, EmbeddingError>;

    /// Compute cosine similarity between two vectors.
    fn similarity(&self, a: &[f32], b: &[f32]) -> f32;

    /// Return model info (provider name, model name, dimensions).
    fn model_info(&self) -> EmbeddingModelInfo;
}

pub struct EmbeddingModelInfo {
    pub provider: String,
    pub model_name: String,
    pub dimensions: usize,
}
```

**MVP Phase 1 Provider:** `MockProvider` — returns deterministic, content-hash-derived synthetic vectors. Enables full test coverage without any model dependency.

**Phase 2 Candidates (separate owner approval):** ONNX Runtime (all-MiniLM-L6-v2), Ollama `/api/embed` adapter.

## Storage Model

Extension to existing SQLite schema (ADR-002). New tables only:

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

- `vector_blob` stores the embedding vector as JSON-serialized `Vec<f32>` in MVP.
- `content_hash` is SHA-256 of `content` + `updated_at` from the `prompts` table.
- No sqlite-vec or external vector DB in MVP.

## Indexing Flow

```
embeddings_index() -> IndexReport
```

1. Verify feature flag is enabled.
2. Load or register embedding model in `embedding_models`.
3. Iterate all prompts from `prompts` table:
   a. Skip if `hygiene.status = 'critical'` or PII/Secret artifacts detected.
   b. Compute `content_hash = SHA-256(content || updated_at)`.
   c. Skip if hash matches existing `prompt_embeddings.content_hash` for same `model_id`.
   d. Call `provider.embed(content)`.
   e. Insert into `prompt_embeddings`.
4. Return `IndexReport`.

**IndexReport structure:**
- `total_prompts`: total in database
- `indexed`: newly embedded
- `skipped_sensitive`: skipped due to sensitivity
- `skipped_unchanged`: skipped due to matching content hash
- `failed`: embedding failures
- `model`: provider and model info
- `duration_ms`: elapsed time

## Semantic Search

```
semantic_search(query: &str, top_k: usize) -> Vec<SemanticResult>
```

1. Embed query using provider.
2. Load all stored embeddings for current model.
3. Compute cosine similarity between query vector and each stored vector.
4. Sort descending by similarity, take top_k.
5. Return results with sanitized metadata (no content).

```
SemanticResult {
    prompt_id: String,
    title: String,
    category: String,
    version: String,
    similarity_score: f32,
}
```

## Hybrid Search

```
hybrid_search(query: &str, top_k: usize) -> Vec<HybridResult>
```

1. Run FTS5 lexical search → `lexical_results` with `lexical_score`.
2. Run semantic search → `semantic_results` with `semantic_score`.
3. Merge and deduplicate by prompt_id.
4. Compute `combined_score = w_lexical * lexical_score + w_semantic * semantic_score`.
5. Default weights: `w_lexical = 0.5`, `w_semantic = 0.5` (configurable).
6. Sort by `combined_score` descending, take top_k.

```
HybridResult {
    prompt_id: String,
    title: String,
    category: String,
    version: String,
    lexical_score: Option<f32>,
    semantic_score: Option<f32>,
    combined_score: f32,
    ranking_reason: String,
}
```

## Duplicate Detection

```
detect_duplicates(threshold: f32) -> Vec<DuplicateGroup>
```

1. Load all stored embeddings for current model.
2. Compute pairwise cosine similarity.
3. Group prompts with similarity >= threshold.
4. Return sanitized group metadata only.

```
DuplicateGroup {
    group_id: String,
    prompt_ids: Vec<String>,
    titles: Vec<String>,
    avg_similarity: f32,
    max_similarity: f32,
}
```

- No automatic deletion, merging, or content modification.
- Threshold: configurable constant, default 0.90.
- Report uses sanitized metadata only.

## Prompt Improvement Helper

```
suggest_improvements(prompt_id: &str) -> ImprovementReport
```

1. Load target prompt content and metadata.
2. Find top_k semantically similar prompts.
3. Analyze similar prompts for canonical sections present in them but missing in target.
4. Canonical sections to check:
   - Context/Background
   - Goal definition
   - Input variables/placeholders
   - Procedure/steps
   - Output format specification
   - Quality requirements
   - Security/safety boundaries
   - Constraints/limitations
5. Return advisory report — no content mutation.

```
ImprovementReport {
    prompt_id: String,
    similar_prompt_ids: Vec<String>,
    missing_sections: Vec<String>,
    section_examples: Vec<SectionExample>,
    confidence: f32,
}

SectionExample {
    section_name: String,
    example_from_prompt_id: String,
    relevance: f32,
}
```

## Privacy / Sensitive Skip

- Prompts with `hygiene.status = 'critical'` → skipped.
- Prompts with `ArtifactCategory::Pii` or `ArtifactCategory::Secret` in hygiene artifacts → skipped.
- Skip is default; explicit opt-in per vault folder may be added later based on owner decision.
- Sensitive prompts are never embedded unless owner explicitly opts in.

## Acceptance Criteria

- [ ] Embedding feature is disabled by default (`PROMPTVAULT_EMBEDDINGS` unset or `0`).
- [ ] With feature disabled, all existing behavior and tests remain unchanged.
- [ ] `EmbeddingProvider` trait exists with `MockProvider` implementation.
- [ ] `embedding_models` and `prompt_embeddings` tables created via migration.
- [ ] `embeddings_index()` uses content hashes and skips unchanged prompts.
- [ ] Sensitive prompts (hygiene critical, PII, secrets) skipped by default.
- [ ] `semantic_search()` returns stable top-k results on synthetic fixtures.
- [ ] `hybrid_search()` returns `lexical_score`, `semantic_score`, `combined_score`, and `ranking_reason`.
- [ ] `detect_duplicates()` emits review-only grouped candidates (no auto-action).
- [ ] `suggest_improvements()` emits advisory missing-section hints only (no content mutation).
- [ ] No prompt content is automatically changed by any embedding operation.
- [ ] No real corpus contents, private paths, or private file names committed.
- [ ] All embedding operations produce structured evidence in `.opencode/evidence/`.
- [ ] Windows-compatible command examples documented.

## Required Tests

| Test | Type | Coverage |
|---|---|---|
| Feature flag off → existing behavior unchanged | Integration | Rust + TS |
| `MockProvider::embed()` returns deterministic vectors | Unit | Rust |
| `embeddings_index()` skips sensitive prompts | Unit | Rust |
| `embeddings_index()` skips unchanged prompts by hash | Unit | Rust |
| `embeddings_index()` produces correct `IndexReport` | Unit | Rust |
| `semantic_search()` returns expected top-k on synthetic fixtures | Unit | Rust |
| `hybrid_search()` produces all three score fields and ranking reason | Unit | Rust |
| `detect_duplicates()` groups above threshold, skips below | Unit | Rust |
| `suggest_improvements()` reports missing sections without mutating | Unit | Rust |
| Error handling: provider unavailable | Unit | Rust |
| Migration: `embedding_models` and `prompt_embeddings` tables created | Unit | Rust |

## Risk Classification

| Risk | Class |
|---|---|
| Feature flag + local-only provider interface | GREEN_SAFE |
| Synthetic fixtures for testing | GREEN_SAFE |
| Review-only reports | GREEN_SAFE |
| New SQLite tables (migration-safe) | GREEN_SAFE |
| Final model choice | YELLOW_REVIEW |
| Vector storage scaling (sqlite-vec decision) | YELLOW_REVIEW |
| Duplicate detection threshold tuning | YELLOW_REVIEW |
| Cloud embedding API | RED_BLOCK |
| Remote LLM dependency | RED_BLOCK |
| Automatic prompt overwrite/delete/merge | RED_BLOCK |
| Remote CI activation | RED_BLOCK |
