// =============================================================================
// PromptVault Lite — Feature Flag Tests
// =============================================================================
// Synthetic tests only. No real environment variables modified.
// =============================================================================

import { describe, it, expect } from "vitest";
import { isEmbeddingsEnabled } from "../featureFlag";

// =============================================================================
// Feature Flag: `isEmbeddingsEnabled`
// =============================================================================

describe("isEmbeddingsEnabled", () => {
  // --- Default (disabled) ---

  it("returns false when no env record is provided (default)", () => {
    expect(isEmbeddingsEnabled()).toBe(false);
  });

  it("returns false when env is an empty object", () => {
    expect(isEmbeddingsEnabled({})).toBe(false);
  });

  it("returns false when PROMPTVAULT_EMBEDDINGS is not set", () => {
    expect(isEmbeddingsEnabled({ OTHER_VAR: "yes" })).toBe(false);
  });

  it("returns false when PROMPTVAULT_EMBEDDINGS is undefined", () => {
    expect(isEmbeddingsEnabled({ PROMPTVAULT_EMBEDDINGS: undefined })).toBe(
      false,
    );
  });

  // --- Disabled by explicit value ---

  it("returns false for PROMPTVAULT_EMBEDDINGS=0", () => {
    expect(isEmbeddingsEnabled({ PROMPTVAULT_EMBEDDINGS: "0" })).toBe(false);
  });

  it("returns false for PROMPTVAULT_EMBEDDINGS=false", () => {
    expect(isEmbeddingsEnabled({ PROMPTVAULT_EMBEDDINGS: "false" })).toBe(
      false,
    );
  });

  it("returns false for PROMPTVAULT_EMBEDDINGS=FALSE (case-sensitive)", () => {
    expect(isEmbeddingsEnabled({ PROMPTVAULT_EMBEDDINGS: "FALSE" })).toBe(
      false,
    );
  });

  it("returns false for PROMPTVAULT_EMBEDDINGS=yes", () => {
    expect(isEmbeddingsEnabled({ PROMPTVAULT_EMBEDDINGS: "yes" })).toBe(false);
  });

  it("returns false for PROMPTVAULT_EMBEDDINGS=TRUE (case-sensitive)", () => {
    expect(isEmbeddingsEnabled({ PROMPTVAULT_EMBEDDINGS: "TRUE" })).toBe(false);
  });

  it("returns false for PROMPTVAULT_EMBEDDINGS=2", () => {
    expect(isEmbeddingsEnabled({ PROMPTVAULT_EMBEDDINGS: "2" })).toBe(false);
  });

  it("returns false for PROMPTVAULT_EMBEDDINGS= (empty string)", () => {
    expect(isEmbeddingsEnabled({ PROMPTVAULT_EMBEDDINGS: "" })).toBe(false);
  });

  it("returns false for PROMPTVAULT_EMBEDDINGS with whitespace", () => {
    expect(isEmbeddingsEnabled({ PROMPTVAULT_EMBEDDINGS: " 1 " })).toBe(false);
  });

  // --- Enabled ---

  it("returns true for PROMPTVAULT_EMBEDDINGS=1", () => {
    expect(isEmbeddingsEnabled({ PROMPTVAULT_EMBEDDINGS: "1" })).toBe(true);
  });

  it("returns true for PROMPTVAULT_EMBEDDINGS=true", () => {
    expect(isEmbeddingsEnabled({ PROMPTVAULT_EMBEDDINGS: "true" })).toBe(true);
  });

  // --- Side-effect freedom ---

  it("has no side effects — returns consistent results on repeated calls", () => {
    const env = { PROMPTVAULT_EMBEDDINGS: "1" };
    expect(isEmbeddingsEnabled(env)).toBe(true);
    expect(isEmbeddingsEnabled(env)).toBe(true);
    expect(isEmbeddingsEnabled(env)).toBe(true);
  });

  it("is a pure function — no global state dependency", () => {
    // First call with on, then with off — each should be independent
    expect(isEmbeddingsEnabled({ PROMPTVAULT_EMBEDDINGS: "1" })).toBe(true);
    expect(isEmbeddingsEnabled({ PROMPTVAULT_EMBEDDINGS: "0" })).toBe(false);
    expect(isEmbeddingsEnabled({ PROMPTVAULT_EMBEDDINGS: "1" })).toBe(true);
  });
});
