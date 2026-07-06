// =============================================================================
// PromptVault Lite — Embeddings Feature Flag
// =============================================================================
// Pure function: checks whether the local embeddings feature is enabled.
// Disabled by default. No side effects. No provider initialisation.
// =============================================================================

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Environment variable that enables local embeddings. */
const EMBEDDINGS_ENV_VAR = "PROMPTVAULT_EMBEDDINGS";

/** Values that count as "enabled". Case-sensitive, owner-defined. */
const ENABLED_VALUES = new Set<string>(["1", "true"]);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Determine whether the local embeddings feature is enabled.
 *
 * Rules:
 * - Default: **false** (feature disabled).
 * - Enabled only when `PROMPTVAULT_EMBEDDINGS` is exactly `"1"` or `"true"`.
 * - Any other value (including empty string, `"0"`, `"false"`, unset) → disabled.
 * - Robust against `undefined` / `null` env records.
 *
 * @param env  Optional environment record (e.g. `process.env`). If omitted,
 *             the function uses `{}` and returns `false`.
 * @returns `true` if the feature flag is explicitly enabled.
 */
export function isEmbeddingsEnabled(
  env?: Record<string, string | undefined>,
): boolean {
  if (!env) return false;

  const raw = env[EMBEDDINGS_ENV_VAR];
  if (raw === undefined) return false;

  return ENABLED_VALUES.has(raw);
}
