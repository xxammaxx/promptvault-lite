// =============================================================================
// Issue #153 — Bounded processedFingerprints Cache Tests (RED)
// =============================================================================
// These tests verify that the bounded Map helper for processedFingerprints:
// - Enforces a maximum size limit
// - Evicts oldest entries when the limit is exceeded (FIFO by insertion order)
// - Supports LRU refresh-on-hit: accessing an existing entry moves it to the end
// - Does not corrupt existing entries during eviction
// - Handles edge cases: empty map, single entry, exact limit
// - Preserves insertion-order semantics of the underlying Map
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  rememberProcessedFingerprint,
  MAX_PROCESSED_FINGERPRINTS,
} from "../cacheUtils";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeFingerprint(content: string): string {
  return `${content.length}:${content.slice(0, 64)}`;
}

// ---------------------------------------------------------------------------
// R1 — Cache size is bounded, never exceeds MAX_PROCESSED_FINGERPRINTS
// ---------------------------------------------------------------------------

describe("R1 — Cache size bounded", () => {
  it("never exceeds MAX_PROCESSED_FINGERPRINTS when adding many entries", () => {
    const cache = new Map<string, string>();
    const items = 2000; // twice the default max

    for (let i = 0; i < items; i++) {
      const key = `prompt-${i}`;
      const fp = makeFingerprint(`Content for prompt ${i}`);
      rememberProcessedFingerprint(cache, key, fp);
    }

    expect(cache.size).toBeLessThanOrEqual(MAX_PROCESSED_FINGERPRINTS);
    // With default max of 1000, we should have exactly 1000 entries
    expect(cache.size).toBe(MAX_PROCESSED_FINGERPRINTS);
  });

  it("does not evict when below max size", () => {
    const cache = new Map<string, string>();
    const limit = 10;

    for (let i = 0; i < 5; i++) {
      const key = `prompt-${i}`;
      const fp = makeFingerprint(`Content ${i}`);
      rememberProcessedFingerprint(cache, key, fp, limit);
    }

    expect(cache.size).toBe(5);
  });

  it("keeps exactly max entries when at limit", () => {
    const cache = new Map<string, string>();
    const limit = 10;

    for (let i = 0; i < 10; i++) {
      const key = `prompt-${i}`;
      const fp = makeFingerprint(`Content ${i}`);
      rememberProcessedFingerprint(cache, key, fp, limit);
    }

    expect(cache.size).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// R2 — Oldest entries are evicted (FIFO by insertion order)
// ---------------------------------------------------------------------------

describe("R2 — Oldest entries evicted (FIFO)", () => {
  it("evicts oldest entries when limit exceeded", () => {
    const cache = new Map<string, string>();
    const limit = 5;

    // Add 5 entries
    for (let i = 0; i < 5; i++) {
      const key = `prompt-${i}`;
      const fp = makeFingerprint(`Content ${i}`);
      rememberProcessedFingerprint(cache, key, fp, limit);
    }
    expect(cache.size).toBe(5);
    expect(cache.has("prompt-0")).toBe(true); // oldest

    // Add 3 more → should evict prompt-0, prompt-1, prompt-2
    for (let i = 5; i < 8; i++) {
      const key = `prompt-${i}`;
      const fp = makeFingerprint(`Content ${i}`);
      rememberProcessedFingerprint(cache, key, fp, limit);
    }

    expect(cache.size).toBe(5);
    expect(cache.has("prompt-0")).toBe(false); // evicted
    expect(cache.has("prompt-1")).toBe(false); // evicted
    expect(cache.has("prompt-2")).toBe(false); // evicted
    expect(cache.has("prompt-3")).toBe(true); // still present
    expect(cache.has("prompt-4")).toBe(true); // still present
    expect(cache.has("prompt-5")).toBe(true); // newly added
    expect(cache.has("prompt-6")).toBe(true); // newly added
    expect(cache.has("prompt-7")).toBe(true); // newly added
  });

  it("evicted entries can be re-added later (no permanent exclusion)", () => {
    const cache = new Map<string, string>();
    const limit = 5;

    // Fill cache
    for (let i = 0; i < 5; i++) {
      rememberProcessedFingerprint(cache, `k-${i}`, `fp-${i}`, limit);
    }
    // Add one more → evict k-0
    rememberProcessedFingerprint(cache, "k-5", "fp-5", limit);
    expect(cache.has("k-0")).toBe(false);

    // Re-add k-0 with new fingerprint
    rememberProcessedFingerprint(cache, "k-0", "fp-0-new", limit);
    expect(cache.has("k-0")).toBe(true);
    expect(cache.get("k-0")).toBe("fp-0-new");
    // Now k-1 should be evicted (not k-0, since k-0 was just re-inserted)
    expect(cache.has("k-1")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// R3 — New entries always survive eviction
// ---------------------------------------------------------------------------

describe("R3 — New entries survive", () => {
  it("most recently added entry always present after eviction", () => {
    const cache = new Map<string, string>();
    const limit = 3;

    rememberProcessedFingerprint(cache, "a", "fp-a", limit);
    rememberProcessedFingerprint(cache, "b", "fp-b", limit);
    rememberProcessedFingerprint(cache, "c", "fp-c", limit);
    rememberProcessedFingerprint(cache, "newest", "fp-newest", limit);

    expect(cache.has("newest")).toBe(true);
    expect(cache.get("newest")).toBe("fp-newest");
    expect(cache.size).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// R4 — LRU refresh-on-hit: accessing existing entry moves it to end
// ---------------------------------------------------------------------------

describe("R4 — LRU refresh-on-hit", () => {
  it("re-adding same key with same fingerprint moves it to end", () => {
    const cache = new Map<string, string>();
    const limit = 3;

    rememberProcessedFingerprint(cache, "a", "fp-a", limit);
    rememberProcessedFingerprint(cache, "b", "fp-b", limit);
    rememberProcessedFingerprint(cache, "c", "fp-c", limit);

    // Re-add "a" with same fingerprint (simulates re-selection)
    rememberProcessedFingerprint(cache, "a", "fp-a", limit);

    // Now add 2 more → "b" should be evicted (not "a")
    rememberProcessedFingerprint(cache, "d", "fp-d", limit);
    rememberProcessedFingerprint(cache, "e", "fp-e", limit);

    expect(cache.has("a")).toBe(true); // refreshed, survived
    expect(cache.has("b")).toBe(false); // evicted
    expect(cache.has("c")).toBe(false); // evicted
    expect(cache.has("d")).toBe(true);
    expect(cache.has("e")).toBe(true);
    expect(cache.size).toBe(3);
  });

  it("re-adding same key with different fingerprint also refreshes position", () => {
    const cache = new Map<string, string>();
    const limit = 2;

    rememberProcessedFingerprint(cache, "a", "fp-a-v1", limit);
    rememberProcessedFingerprint(cache, "b", "fp-b", limit);

    // Content changed: re-add "a" with new fingerprint
    rememberProcessedFingerprint(cache, "a", "fp-a-v2", limit);

    // New entry pushes out "b" (not "a")
    rememberProcessedFingerprint(cache, "c", "fp-c", limit);

    expect(cache.has("a")).toBe(true);
    expect(cache.get("a")).toBe("fp-a-v2"); // updated value
    expect(cache.has("b")).toBe(false);
    expect(cache.has("c")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// R5 — Already-processed fingerprints are preserved
// ---------------------------------------------------------------------------

describe("R5 — Existing fingerprints preserved", () => {
  it("calling with existing key does not lose the entry", () => {
    const cache = new Map<string, string>();
    const limit = 10;

    rememberProcessedFingerprint(cache, "x", "fp-x", limit);
    // Same key, same fingerprint — should still be there
    rememberProcessedFingerprint(cache, "x", "fp-x", limit);
    expect(cache.has("x")).toBe(true);
    expect(cache.get("x")).toBe("fp-x");
    expect(cache.size).toBe(1);
  });

  it("entries survive after multiple eviction cycles if refreshed", () => {
    const cache = new Map<string, string>();
    const limit = 3;

    // Add "persistent" and two others
    rememberProcessedFingerprint(cache, "persistent", "fp-p", limit);
    rememberProcessedFingerprint(cache, "temp1", "fp-t1", limit);
    rememberProcessedFingerprint(cache, "temp2", "fp-t2", limit);

    // Refresh "persistent" before each eviction cycle
    for (let cycle = 0; cycle < 10; cycle++) {
      rememberProcessedFingerprint(cache, "persistent", "fp-p", limit);
      rememberProcessedFingerprint(cache, `new-${cycle}`, `fp-n${cycle}`, limit);
    }

    expect(cache.has("persistent")).toBe(true);
    expect(cache.get("persistent")).toBe("fp-p");
    expect(cache.size).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// R6 — Edge cases
// ---------------------------------------------------------------------------

describe("R6 — Edge cases", () => {
  it("works with max size of 1", () => {
    const cache = new Map<string, string>();
    const limit = 1;

    rememberProcessedFingerprint(cache, "a", "fp-a", limit);
    expect(cache.size).toBe(1);
    expect(cache.has("a")).toBe(true);

    rememberProcessedFingerprint(cache, "b", "fp-b", limit);
    expect(cache.size).toBe(1);
    expect(cache.has("a")).toBe(false);
    expect(cache.has("b")).toBe(true);
  });

  it("works with empty cache", () => {
    const cache = new Map<string, string>();
    const limit = 5;

    rememberProcessedFingerprint(cache, "first", "fp-first", limit);
    expect(cache.size).toBe(1);
    expect(cache.get("first")).toBe("fp-first");
  });

  it("handles large max size gracefully", () => {
    const cache = new Map<string, string>();
    const limit = 5000;

    for (let i = 0; i < 100; i++) {
      rememberProcessedFingerprint(cache, `k-${i}`, `fp-${i}`, limit);
    }

    expect(cache.size).toBe(100);
    // No eviction should occur
    expect(cache.has("k-0")).toBe(true);
    expect(cache.has("k-99")).toBe(true);
  });

  it("eviction deterministically removes oldest when many are over limit", () => {
    const cache = new Map<string, string>();
    const limit = 3;

    for (let i = 0; i < 3; i++) {
      rememberProcessedFingerprint(cache, `k-${i}`, `fp-${i}`, limit);
    }

    // Add 5 more at once
    for (let i = 3; i < 8; i++) {
      rememberProcessedFingerprint(cache, `k-${i}`, `fp-${i}`, limit);
    }

    expect(cache.size).toBe(3);
    // First 5 entries (k-0 through k-4) should be evicted
    expect(cache.has("k-0")).toBe(false);
    expect(cache.has("k-1")).toBe(false);
    expect(cache.has("k-2")).toBe(false);
    expect(cache.has("k-3")).toBe(false);
    expect(cache.has("k-4")).toBe(false);
    // Last 3 entries survive
    expect(cache.has("k-5")).toBe(true);
    expect(cache.has("k-6")).toBe(true);
    expect(cache.has("k-7")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// R7 — Default max size is used when not specified
// ---------------------------------------------------------------------------

describe("R7 — Default max size", () => {
  it("uses MAX_PROCESSED_FINGERPRINTS as default when maxSize not provided", () => {
    // Verify that MAX_PROCESSED_FINGERPRINTS is a reasonable default
    expect(MAX_PROCESSED_FINGERPRINTS).toBeGreaterThan(0);
    expect(MAX_PROCESSED_FINGERPRINTS).toBeLessThanOrEqual(2000);
  });

  it("allows overriding max size for testing", () => {
    const cache = new Map<string, string>();
    const smallLimit = 2;

    rememberProcessedFingerprint(cache, "a", "fp-a", smallLimit);
    rememberProcessedFingerprint(cache, "b", "fp-b", smallLimit);
    rememberProcessedFingerprint(cache, "c", "fp-c", smallLimit);

    expect(cache.size).toBe(2);
    expect(cache.has("a")).toBe(false);
    expect(cache.has("b")).toBe(true);
    expect(cache.has("c")).toBe(true);
  });
});
