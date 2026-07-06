// =============================================================================
// PromptVault Lite — Embedding Provider Interface
// =============================================================================
// Provider-agnostic contract for local embedding generation.
// Phase 1: mock/synthetic provider only. Real providers deferred per ADR-004.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Input for a single embedding request. */
export interface EmbeddingInput {
  /** Stable identifier for the embedding (not required to be a prompt ID). */
  id: string;
  /** Text content to embed (synthetic fixture text in Phase 1). */
  text: string;
  /** Optional arbitrary metadata (never exposed to the embedding algorithm). */
  metadata?: Record<string, unknown>;
}

/** Result of a single embedding request. */
export interface EmbeddingVector {
  /** Matches the `id` from the corresponding `EmbeddingInput`. */
  id: string;
  /** Number of dimensions in the `values` array. */
  dimensions: number;
  /** Normalised embedding vector values (Phase 1: synthetic mock values). */
  values: number[];
  /** Provider identifier — must be `"mock"` in Phase 1. */
  provider: string;
  /** Model identifier — must be `"mock-synthetic-v1"` in Phase 1. */
  model: string;
}

// ---------------------------------------------------------------------------
// Provider Contract
// ---------------------------------------------------------------------------

/**
 * Abstract contract for an embedding provider.
 *
 * Phase 1 restrictions:
 * - Only `"mock"` provider exists.
 * - No network, no file access, no process spawning.
 * - No real embedding model.
 */
export interface EmbeddingProvider {
  /** Provider identifier (e.g. `"mock"`). */
  readonly provider: string;
  /** Model identifier (e.g. `"mock-synthetic-v1"`). */
  readonly model: string;
  /** Fixed vector dimensions returned by this provider. */
  readonly dimensions: number;

  /**
   * Generate a single embedding vector from an input.
   *
   * @returns Resolves with the embedding vector. Must never throw on valid
   *          input; instead return a zero-vector for truly empty content.
   */
  embed(input: EmbeddingInput): Promise<EmbeddingVector>;

  /**
   * Generate embedding vectors for multiple inputs.
   *
   * Order guarantee: `results[i]` corresponds to `inputs[i]`.
   *
   * @returns Resolves with an array of vectors in the same order as inputs.
   */
  embedBatch(inputs: EmbeddingInput[]): Promise<EmbeddingVector[]>;
}
