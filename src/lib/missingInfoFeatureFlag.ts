// =============================================================================
// PromptVault Lite — Missing-Info-Gate Feature Flag
// =============================================================================
// Pure function: checks whether the Missing-Info-Gate feature is enabled.
// Disabled by default. No side effects. No UI or detector initialisation.
// =============================================================================

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Environment variable that enables the Missing-Info-Gate. */
const MISSING_INFO_GATE_ENV_VAR = "PROMPTVAULT_MISSING_INFO_GATE";

/** Values that count as "enabled". Case-sensitive, owner-defined. */
const ENABLED_VALUES = new Set<string>(["1", "true"]);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Determine whether the Missing-Info-Gate feature is enabled.
 *
 * Rules:
 * - Default: **false** (feature disabled).
 * - Enabled only when `PROMPTVAULT_MISSING_INFO_GATE` is exactly `"1"` or `"true"`.
 * - Any other value (including empty string, `"0"`, `"false"`, `"TRUE"`, `"yes"`,
 *   whitespace-padded, unset) → disabled.
 * - Robust against `undefined` / `null` env records.
 *
 * @param env  Optional environment record (e.g. `process.env`). If omitted,
 *             the function uses `{}` and returns `false`.
 * @returns `true` if the feature flag is explicitly enabled.
 */
export function isMissingInfoGateEnabled(
  env?: Record<string, string | undefined>,
): boolean {
  if (!env) return false;

  const raw = env[MISSING_INFO_GATE_ENV_VAR];
  if (raw === undefined) return false;

  return ENABLED_VALUES.has(raw);
}
