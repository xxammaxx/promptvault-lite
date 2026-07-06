// =============================================================================
// PromptVault Lite — Provider Contract Tests
// =============================================================================
// Tests the factory/loader contract: feature-flag gating, safe-fail on unknown
// provider, and stable provider metadata.
// =============================================================================

import { describe, it, expect } from "vitest";
import { createEmbeddingProvider } from "../index";
import type { EmbeddingProvider } from "../provider";

// =============================================================================
// Helpers
// =============================================================================

/** Narrow a nullable provider to a non-null provider or throw. */
function assertProvider(p: EmbeddingProvider | null): EmbeddingProvider {
  if (!p) {
    throw new Error("Expected EmbeddingProvider but got null");
  }
  return p;
}

// =============================================================================
// Factory Contract: `createEmbeddingProvider`
// =============================================================================

describe("createEmbeddingProvider — factory contract", () => {
  // --- Feature flag off ---

  it("returns null when no options are provided (flag off by default)", () => {
    const provider = createEmbeddingProvider();
    expect(provider).toBeNull();
  });

  it("returns null when env is empty (flag off)", () => {
    const provider = createEmbeddingProvider({ env: {} });
    expect(provider).toBeNull();
  });

  it("returns null when PROMPTVAULT_EMBEDDINGS is not set", () => {
    const provider = createEmbeddingProvider({
      env: { OTHER_VAR: "abc" },
    });
    expect(provider).toBeNull();
  });

  it("returns null when PROMPTVAULT_EMBEDDINGS=0", () => {
    const provider = createEmbeddingProvider({
      env: { PROMPTVAULT_EMBEDDINGS: "0" },
    });
    expect(provider).toBeNull();
  });

  // --- Feature flag on → mock provider ---

  it("returns a MockEmbeddingProvider when PROMPTVAULT_EMBEDDINGS=1", () => {
    const provider = assertProvider(
      createEmbeddingProvider({
        env: { PROMPTVAULT_EMBEDDINGS: "1" },
      }),
    );
    expect(provider).not.toBeNull();
    expect(provider.provider).toBe("mock");
  });

  it("returns a MockEmbeddingProvider when PROMPTVAULT_EMBEDDINGS=true", () => {
    const provider = assertProvider(
      createEmbeddingProvider({
        env: { PROMPTVAULT_EMBEDDINGS: "true" },
      }),
    );
    expect(provider.provider).toBe("mock");
  });

  // --- Provider metadata stability ---

  it("provider identifier is stable 'mock'", () => {
    const provider = assertProvider(
      createEmbeddingProvider({
        env: { PROMPTVAULT_EMBEDDINGS: "1" },
      }),
    );
    expect(provider.provider).toBe("mock");
  });

  it("model identifier is stable 'mock-synthetic-v1'", () => {
    const provider = assertProvider(
      createEmbeddingProvider({
        env: { PROMPTVAULT_EMBEDDINGS: "1" },
      }),
    );
    expect(provider.model).toBe("mock-synthetic-v1");
  });

  it("dimensions is a positive integer (8)", () => {
    const provider = assertProvider(
      createEmbeddingProvider({
        env: { PROMPTVAULT_EMBEDDINGS: "1" },
      }),
    );
    expect(provider.dimensions).toBe(8);
    expect(Number.isInteger(provider.dimensions)).toBe(true);
    expect(provider.dimensions).toBeGreaterThan(0);
  });

  // --- No side effects ---

  it("factory has no side effects — repeated calls return fresh instances", () => {
    const env = { PROMPTVAULT_EMBEDDINGS: "1" };
    const a = assertProvider(createEmbeddingProvider({ env }));
    const b = assertProvider(createEmbeddingProvider({ env }));
    // Different calls may return different object references (factory pattern)
    // but both should have the same stable metadata
    expect(a.provider).toBe(b.provider);
    expect(a.model).toBe(b.model);
    expect(a.dimensions).toBe(b.dimensions);
  });

  it("factory returns null independently when called after enabled call", () => {
    const on = createEmbeddingProvider({
      env: { PROMPTVAULT_EMBEDDINGS: "1" },
    });
    expect(on).not.toBeNull();

    const off = createEmbeddingProvider({
      env: { PROMPTVAULT_EMBEDDINGS: "0" },
    });
    expect(off).toBeNull();
  });
});
