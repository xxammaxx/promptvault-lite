// =============================================================================
// PromptVault Lite — Embeddings Module Barrel
// =============================================================================
// Re-exports the feature flag, provider interface, mock provider, and factory.
// =============================================================================

import { isEmbeddingsEnabled } from "./featureFlag";
import { MockEmbeddingProvider } from "./mockProvider";
import type {
  EmbeddingInput,
  EmbeddingVector,
  EmbeddingProvider,
} from "./provider";

// Re-exports
export { isEmbeddingsEnabled };
export type { EmbeddingInput, EmbeddingVector, EmbeddingProvider };
export { MockEmbeddingProvider };

// ---------------------------------------------------------------------------
// Factory Options
// ---------------------------------------------------------------------------

export interface CreateEmbeddingProviderOptions {
  /** Environment record (e.g. `process.env`) for feature-flag inspection. */
  env?: Record<string, string | undefined>;
}

// ---------------------------------------------------------------------------
// Factory / Loader
// ---------------------------------------------------------------------------

/**
 * Create an embedding provider if the feature flag is enabled.
 *
 * Rules:
 * - Returns `null` when `isEmbeddingsEnabled(env)` is `false`.
 * - Returns a `MockEmbeddingProvider` when the flag is enabled (Phase 1 only).
 * - Safe-fail: unknown provider name → `null`.
 * - No side effects: does not initialise any real model, network, or storage.
 *
 * @param options  Optional environment record for feature-flag inspection.
 * @returns An `EmbeddingProvider` instance, or `null` if the feature is disabled.
 */
export function createEmbeddingProvider(
  options?: CreateEmbeddingProviderOptions,
): EmbeddingProvider | null {
  if (!isEmbeddingsEnabled(options?.env)) {
    return null;
  }

  // Phase 1: only mock provider exists
  return new MockEmbeddingProvider();
}
