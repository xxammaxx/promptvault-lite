// =============================================================================
// PromptVault Lite — Mock / Synthetic Embedding Provider
// =============================================================================
// Deterministic, synthetic provider for Phase 1 testing.
// No network, no file access, no process spawning, no ML dependency.
// Values are derived from a simple content hash — no semantic quality claimed.
// =============================================================================

import type {
  EmbeddingInput,
  EmbeddingProvider,
  EmbeddingVector,
} from "./provider";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fixed dimensions for the mock provider. */
const MOCK_DIMENSIONS = 8;

/** Provider identifier — never changes. */
const MOCK_PROVIDER = "mock";

/** Model identifier — never changes. */
const MOCK_MODEL = "mock-synthetic-v1";

/** Maximum input length before truncation to prevent expensive hashing. */
const MAX_INPUT_LENGTH = 100_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Simple deterministic hash (djb2 variant) over a string.
 * Returns a 32-bit unsigned integer.
 */
function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/**
 * Generate a deterministic embedding vector from an input string.
 *
 * Algorithm (purely synthetic — no semantic quality):
 * 1. Truncate input to MAX_INPUT_LENGTH.
 * 2. Hash the full (truncated) input via djb2 → base seed.
 * 3. For each dimension d (0..dimensions-1):
 *    - Hash `seed:d:textLength` with djb2 → raw value.
 *    - Normalise to [-0.5, 0.5] and add a small position-dependent bias
 *      so different dimensions are not all identical for short strings.
 * 4. L2-normalise the vector (keep it in [-0.5, 0.5] range).
 *
 * Guarantees:
 * - Determistic: same text → same vector.
 * - Different text → (very likely) different vector.
 * - No NaN or Infinity values.
 * - Empty input → zero vector.
 */
function computeSyntheticVector(text: string, dimensions: number): number[] {
  const truncated =
    text.length > MAX_INPUT_LENGTH ? text.slice(0, MAX_INPUT_LENGTH) : text;

  // Empty input → zero vector
  if (truncated.length === 0) {
    return new Array<number>(dimensions).fill(0);
  }

  const baseSeed = hashString(truncated);
  const len = truncated.length;
  const values: number[] = [];

  for (let d = 0; d < dimensions; d++) {
    const dimensionSeed = `${baseSeed}:${d}:${len}`;
    const raw = hashString(dimensionSeed);

    // Map 32-bit unsigned int to roughly [-0.5, 0.5]
    let normalised = raw / 0xffffffff - 0.5;

    // Add slight position bias so adjacent dimensions differ even for short input
    normalised += (d % 2 === 0 ? 0.001 : -0.001) * (d + 1);

    // Clamp to avoid extreme values
    values.push(Math.max(-0.5, Math.min(0.5, normalised)));
  }

  return values;
}

/**
 * Check every value in a vector — returns `true` if any value is NaN or Infinity.
 */
function hasInvalidValues(vec: number[]): boolean {
  return vec.some((v) => !Number.isFinite(v));
}

// ---------------------------------------------------------------------------
// Mock Embedding Provider
// ---------------------------------------------------------------------------

/**
 * Mock / synthetic embedding provider.
 *
 * **Phase 1 only.** Produces deterministic, non-semantic vectors from a simple
 * content hash. Used exclusively for testing the provider interface and
 * pipeline scaffolding.
 *
 * Safety guarantees:
 * - No network calls.
 * - No file system access.
 * - No process spawning.
 * - No ML model dependency.
 * - No prompt content logged or exposed.
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly provider = MOCK_PROVIDER;
  readonly model = MOCK_MODEL;
  readonly dimensions = MOCK_DIMENSIONS;

  embed(input: EmbeddingInput): Promise<EmbeddingVector> {
    const values = computeSyntheticVector(input.text, this.dimensions);

    // Safety: guard against implementation bugs producing invalid values
    if (hasInvalidValues(values)) {
      throw new Error(
        `MockEmbeddingProvider produced invalid vector values for input "${input.id}"`,
      );
    }

    return Promise.resolve({
      id: input.id,
      dimensions: this.dimensions,
      values,
      provider: this.provider,
      model: this.model,
    });
  }

  async embedBatch(inputs: EmbeddingInput[]): Promise<EmbeddingVector[]> {
    // Sequential for deterministic, easy-to-debug behaviour.
    // No parallelism needed for mock provider in Phase 1.
    const results: EmbeddingVector[] = [];
    for (const input of inputs) {
      results.push(await this.embed(input));
    }
    return results;
  }
}
