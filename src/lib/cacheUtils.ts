// =============================================================================
// Issue #153 — Bounded Processed Fingerprints Cache
// =============================================================================
// Provides a bounded, LRU-refresh-on-hit Map helper for content fingerprint
// caching in the blueprint auto-detection flow.
// =============================================================================

/**
 * Maximum number of processed fingerprints to retain.
 *
 * Sized for typical vaults (hundreds of prompts) while preventing unbounded
 * growth in large vaults (1000+ prompts). Each entry is ~100 bytes, so 1000
 * entries consume ~100 KB — well within acceptable browser memory limits.
 */
export const MAX_PROCESSED_FINGERPRINTS = 1000;

/**
 * Remembers a content fingerprint for a prompt ID in a bounded cache.
 *
 * If the key already exists, it is refreshed (deleted and re-inserted) to
 * implement LRU refresh-on-hit: recently accessed entries survive longer.
 * If the key is new, it is added. If the cache exceeds `maxSize`, the oldest
 * entries (by insertion order) are evicted.
 *
 * This function is pure: it mutates the provided Map and has no side effects.
 * It is safe to call from any context (React effects, event handlers, tests).
 *
 * @param cache - The Map to mutate (typically `processedFingerprints.current`).
 * @param key   - The prompt ID (string).
 * @param fingerprint - The content fingerprint `${length}:${slice(0,64)}`.
 * @param maxSize - Maximum cache size (defaults to MAX_PROCESSED_FINGERPRINTS).
 */
export function rememberProcessedFingerprint(
  cache: Map<string, string>,
  key: string,
  fingerprint: string,
  maxSize: number = MAX_PROCESSED_FINGERPRINTS,
): void {
  // LRU refresh-on-hit: delete existing entry so re-insertion moves it to end.
  if (cache.has(key)) {
    cache.delete(key);
  }

  cache.set(key, fingerprint);

  // Evict oldest entries (FIFO by insertion order) if over max size.
  // Map.prototype.keys() returns keys in insertion order, so the first key
  // is the oldest.
  while (cache.size > maxSize) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    } else {
      // Safety: should never happen, but prevents infinite loop.
      break;
    }
  }
}
