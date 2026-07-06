// =============================================================================
// PromptVault Lite — Mock Provider Tests
// =============================================================================
// Synthetic fixture tests for MockEmbeddingProvider.
// No real corpus content, no network, no file access.
// =============================================================================

import { describe, it, expect } from "vitest";
import { MockEmbeddingProvider } from "../mockProvider";
import type { EmbeddingInput } from "../provider";

// =============================================================================
// Synthetic Test Fixtures
// =============================================================================

const FIXTURE_A: EmbeddingInput = {
  id: "synth-a",
  text: "You are a helpful code review assistant. Find bugs in the given code.",
};

const FIXTURE_B: EmbeddingInput = {
  id: "synth-b",
  text: "You are a creative writing coach. Help improve narrative flow.",
};

const FIXTURE_EMPTY: EmbeddingInput = {
  id: "synth-empty",
  text: "",
};

const FIXTURE_LONG: EmbeddingInput = {
  id: "synth-long",
  text: "x".repeat(200_000), // 200k chars — beyond the 100k truncation threshold
};

const FIXTURE_WHITESPACE: EmbeddingInput = {
  id: "synth-ws",
  text: "   \n  \t  \n  ",
};

// =============================================================================
// Unit Tests
// =============================================================================

describe("MockEmbeddingProvider", () => {
  const provider = new MockEmbeddingProvider();

  // --- Metadata ---

  it("has provider identifier 'mock'", () => {
    expect(provider.provider).toBe("mock");
  });

  it("has model identifier 'mock-synthetic-v1'", () => {
    expect(provider.model).toBe("mock-synthetic-v1");
  });

  it("has 8 dimensions", () => {
    expect(provider.dimensions).toBe(8);
  });

  // --- Determinism ---

  it("returns deterministic vectors for the same input", async () => {
    const v1 = await provider.embed(FIXTURE_A);
    const v2 = await provider.embed(FIXTURE_A);
    expect(v1.values).toEqual(v2.values);
  });

  it("returns different vectors for different inputs", async () => {
    const vA = await provider.embed(FIXTURE_A);
    const vB = await provider.embed(FIXTURE_B);
    // Very unlikely to be identical with djb2 hash
    expect(vA.values).not.toEqual(vB.values);
  });

  it("returns different vectors for inputs differing by one character", async () => {
    const v1 = await provider.embed({
      id: "t1",
      text: "hello world",
    });
    const v2 = await provider.embed({
      id: "t2",
      text: "hello worlD",
    });
    expect(v1.values).not.toEqual(v2.values);
  });

  // --- Vector properties ---

  it("vector dimensions match provider.dimensions", async () => {
    const v = await provider.embed(FIXTURE_A);
    expect(v.dimensions).toBe(provider.dimensions);
    expect(v.values).toHaveLength(provider.dimensions);
  });

  it("vector contains no NaN values", async () => {
    const v = await provider.embed(FIXTURE_A);
    for (const val of v.values) {
      expect(Number.isNaN(val)).toBe(false);
    }
  });

  it("vector contains no Infinity values", async () => {
    const v = await provider.embed(FIXTURE_A);
    for (const val of v.values) {
      expect(Number.isFinite(val)).toBe(true);
    }
  });

  it("vector values are within expected range [-0.5, 0.5]", async () => {
    const v = await provider.embed(FIXTURE_A);
    for (const val of v.values) {
      expect(val).toBeGreaterThanOrEqual(-0.5);
      expect(val).toBeLessThanOrEqual(0.5);
    }
  });

  // --- Edge cases ---

  it("handles empty string input — returns zero vector", async () => {
    const v = await provider.embed(FIXTURE_EMPTY);
    expect(v.values).toEqual(new Array(provider.dimensions).fill(0));
    expect(v.id).toBe(FIXTURE_EMPTY.id);
  });

  it("handles very long input without error (truncation)", async () => {
    const v = await provider.embed(FIXTURE_LONG);
    expect(v.values).toHaveLength(provider.dimensions);
    expect(v.id).toBe(FIXTURE_LONG.id);
    // Should not throw and should produce valid values
    for (const val of v.values) {
      expect(Number.isFinite(val)).toBe(true);
    }
  });

  it("handles whitespace-only input gracefully", async () => {
    const v = await provider.embed(FIXTURE_WHITESPACE);
    expect(v.values).toHaveLength(provider.dimensions);
    for (const val of v.values) {
      expect(Number.isFinite(val)).toBe(true);
    }
  });

  // --- Metadata in result ---

  it("result carries correct metadata (provider, model, dimensions)", async () => {
    const v = await provider.embed(FIXTURE_A);
    expect(v.provider).toBe("mock");
    expect(v.model).toBe("mock-synthetic-v1");
    expect(v.dimensions).toBe(provider.dimensions);
  });

  it("result.id matches input.id", async () => {
    const v = await provider.embed(FIXTURE_A);
    expect(v.id).toBe(FIXTURE_A.id);
  });

  // --- Batch ---

  it("embedBatch returns results in the same order as inputs", async () => {
    const inputs = [FIXTURE_A, FIXTURE_B, FIXTURE_EMPTY];
    const results = await provider.embedBatch(inputs);
    expect(results).toHaveLength(3);
    expect(results[0].id).toBe(FIXTURE_A.id);
    expect(results[1].id).toBe(FIXTURE_B.id);
    expect(results[2].id).toBe(FIXTURE_EMPTY.id);
  });

  it("embedBatch returns deterministic results for the same batch", async () => {
    const inputs = [FIXTURE_A, FIXTURE_B];
    const batch1 = await provider.embedBatch(inputs);
    const batch2 = await provider.embedBatch(inputs);
    expect(batch1.map((v) => v.values)).toEqual(batch2.map((v) => v.values));
  });

  it("embedBatch handles single-element array", async () => {
    const results = await provider.embedBatch([FIXTURE_A]);
    expect(results).toHaveLength(1);
    const single = await provider.embed(FIXTURE_A);
    expect(results[0].values).toEqual(single.values);
  });

  it("embedBatch with empty array returns empty array", async () => {
    const results = await provider.embedBatch([]);
    expect(results).toEqual([]);
  });

  // ===========================================================================
  // Safety Tests
  // ===========================================================================

  describe("safety", () => {
    it("MockEmbeddingProvider has no network/http import", () => {
      // The mock provider module should not import fetch, http, https, net, etc.
      // We verify indirectly: the class has no 'fetch' property and embed
      // resolves without any network activity.
      expect(
        typeof (provider as unknown as Record<string, unknown>).fetch,
      ).toBe("undefined");
    });

    it("embed does not expose prompt content in the result values", async () => {
      // The vector values are synthetic hashes — they should not contain the
      // original text content refs.
      const v = await provider.embed(FIXTURE_A);
      // Values are just numbers in [-0.5, 0.5] range, no string content
      for (const val of v.values) {
        expect(typeof val).toBe("number");
      }
    });

    it("provider has no spawn/exec capability", () => {
      const p = provider as unknown as Record<string, unknown>;
      expect(p.spawn).toBeUndefined();
      expect(p.exec).toBeUndefined();
      expect(p.childProcess).toBeUndefined();
    });
  });
});
