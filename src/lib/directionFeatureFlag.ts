// =============================================================================
// PromptVault Lite — Direction Profiles Feature Flag
// =============================================================================
// Pure function: checks whether the Direction Profiles feature is enabled.
// Disabled by default. No side effects. No UI or generator initialisation.
// =============================================================================

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Environment variable that enables the Direction Profiles feature. */
const DIRECTION_PROFILES_ENV_VAR = "PROMPTVAULT_DIRECTION_PROFILES";

/** Values that count as "enabled". Case-sensitive, owner-defined. */
const ENABLED_VALUES = new Set<string>(["1", "true"]);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Determine whether the Direction Profiles feature is enabled.
 *
 * Rules:
 * - Default: **false** (feature disabled).
 * - Enabled only when `PROMPTVAULT_DIRECTION_PROFILES` is exactly `"1"` or `"true"`.
 * - Any other value (including empty string, `"0"`, `"false"`, `"TRUE"`, `"yes"`,
 *   whitespace-padded, unset) → disabled.
 * - Robust against `undefined` / `null` env records.
 *
 * @param env  Optional environment record (e.g. `process.env`). If omitted,
 *             the function uses `{}` and returns `false`.
 * @returns `true` if the feature flag is explicitly enabled.
 */
export function isDirectionProfilesEnabled(
  env?: Record<string, string | undefined>,
): boolean {
  if (!env) return false;

  const raw = env[DIRECTION_PROFILES_ENV_VAR];
  if (raw === undefined) return false;

  return ENABLED_VALUES.has(raw);
}
