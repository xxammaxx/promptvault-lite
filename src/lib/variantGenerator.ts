// =============================================================================
// PromptVault Lite — Variant Generator (#215)
// =============================================================================
// Template-based variant generation — no LLM, no network, no cloud.
// Phase 1: Prefix injection + constraint preservation.
// Phase 2/3 (later batches): constraint conflict detection + security hardening.
//
// Key invariants:
// — Original prompt content is NEVER mutated (always returns new strings).
// — Hard constraints are preserved and referenced.
// — Custom profiles handled as separate free-text code path.
// — Max 5 variants per run (owner decision Q2).
// =============================================================================

import type {
  DirectionProfile,
  DirectionProfileSelection,
  PromptVariant,
  VariantGenerationResult,
  VariantConflict,
  PreservedConstraintReference,
  HardConstraint,
} from "@/types";
import { extractHardConstraints } from "./constraintChecker";
import { getProfile, DIRECTION_PROFILES } from "./directionProfiles";

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_MAX_VARIANTS = 5;

// =============================================================================
// applyDirectionProfile — Prefix Injection
// =============================================================================

/**
 * Apply a Direction Profile to prompt content via template-based prefix injection.
 *
 * The profile's `promptPrefix` is prepended to the original content, acting
 * as a role/tone instruction. The original content is NEVER mutated — a new
 * string is always returned.
 *
 * @param content  The original (or enriched) prompt text.
 * @param profile  The DirectionProfile to apply.
 * @returns A new string with the profile prefix prepended.
 *          Empty/whitespace content returns "".
 *          Empty promptPrefix returns the content unchanged.
 */
export function applyDirectionProfile(
  content: string,
  profile: DirectionProfile,
): string {
  // Empty or whitespace-only content → no variant
  if (!content || content.trim().length === 0) {
    return "";
  }

  // No prompt prefix → return content as-is (e.g. custom profile with empty text)
  if (!profile.promptPrefix || profile.promptPrefix.trim().length === 0) {
    return content;
  }

  // Template: [Role/Instruction]\n\n[Original Content]
  return `${profile.promptPrefix}\n\n${content}`;
}

// =============================================================================
// generateVariants — Multi-Profile Generation
// =============================================================================

export interface GenerateVariantsOptions {
  /** Maximum number of variants to produce (default: 5). */
  maxVariants?: number;
  /** Was enriched content used as the source? */
  enrichedContentUsed?: boolean;
}

/**
 * Generate prompt variants for one or more selected direction profiles.
 *
 * Algorithm:
 * 1. Deduplicate selected profile IDs.
 * 2. Resolve profiles: predefined from directionProfiles.ts, custom from
 *    selection.customDirectionText.
 * 3. Extract hard constraints from source content.
 * 4. For each profile (up to maxVariants):
 *    a. Apply profile prefix via template injection.
 *    b. Map constraints to preserved references.
 *    c. Build PromptVariant object.
 * 5. Return VariantGenerationResult.
 *
 * Note: Full constraint conflict detection (checkDirectionProfileConflicts)
 * is deferred to Batch 3 (T-215-006). In this phase, conflicts are marked
 * as "manual_review" and profileConflicts is empty.
 *
 * @param sourceContent  Original or enriched prompt text.
 * @param selection      User's profile selection (IDs + optional custom text).
 * @param options        Generation options (maxVariants, enrichedContentUsed).
 * @returns VariantGenerationResult with all generated variants.
 */
export function generateVariants(
  sourceContent: string,
  selection: DirectionProfileSelection,
  options: GenerateVariantsOptions = {},
): VariantGenerationResult {
  const maxVariants = options.maxVariants ?? DEFAULT_MAX_VARIANTS;
  const enrichedContentUsed = options.enrichedContentUsed ?? false;
  const appliedAt = new Date().toISOString();

  // --- 1. Deduplicate & validate profile IDs ---
  const uniqueIds = [...new Set(selection.selectedProfileIds)];

  if (uniqueIds.length === 0) {
    return {
      sourceContent,
      enrichedContentUsed,
      variants: [],
      profileConflicts: [],
      appliedAt,
    };
  }

  // --- 2. Extract constraints from source ---
  const constraints = extractHardConstraints(sourceContent);

  // --- 3. Build preserved constraint references ---
  const preservedConstraints: PreservedConstraintReference[] = constraints.map(
    (c: HardConstraint) => ({
      constraintId: c.id,
      constraintText: c.constraintText,
      category: c.category,
      affectedByProfile: false, // Batch 3 will set this to true for conflicts
    }),
  );

  // --- 4. Generate variants ---
  let variantCounter = 0;
  const variants: PromptVariant[] = [];

  for (const profileId of uniqueIds) {
    if (variants.length >= maxVariants) break;

    // Handle custom profile
    if (profileId === "custom") {
      const customText = selection.customDirectionText?.trim();
      if (!customText) {
        // Custom with empty text → skip (not an error, just no-op)
        continue;
      }

      variantCounter += 1;
      const customProfile: DirectionProfile = {
        profileId: "custom",
        label: "Benutzerdefiniert",
        category: "custom",
        description: `Benutzerdefinierte Richtung: "${customText}"`,
        promptPrefix: customText,
        compatibleConstraintCategories: [],
        conflictingConstraintCategories: [],
        recommendation:
          "Benutzerdefinierte Richtung — keine automatische Constraint-Prüfung.",
      };

      const generatedContent = applyDirectionProfile(
        sourceContent,
        customProfile,
      );
      const variant = mapToPromptVariant(
        generatedContent,
        customProfile,
        preservedConstraints,
        [], // No constraint conflicts in Batch 2
        enrichedContentUsed ? "enriched" : "original",
        variantCounter,
      );
      variants.push(variant);
      continue;
    }

    // Look up predefined profile
    const profile = getProfile(profileId);
    if (!profile) {
      // Unknown profile ID → skip silently
      continue;
    }

    variantCounter += 1;
    const generatedContent = applyDirectionProfile(sourceContent, profile);

    // Build per-variant conflicts (empty in Batch 2 — deferred to Batch 3)
    const variantConflicts: VariantConflict[] = [];

    const variant = mapToPromptVariant(
      generatedContent,
      profile,
      preservedConstraints,
      variantConflicts,
      enrichedContentUsed ? "enriched" : "original",
      variantCounter,
    );
    variants.push(variant);
  }

  return {
    sourceContent,
    enrichedContentUsed,
    variants,
    profileConflicts: [], // Batch 3: populated by checkDirectionProfileConflicts
    appliedAt,
  };
}

// =============================================================================
// mapToPromptVariant — Object Mapper
// =============================================================================

/**
 * Map raw generated content and metadata into a fully-formed PromptVariant.
 *
 * @param generatedContent      The string produced by applyDirectionProfile.
 * @param profile               The DirectionProfile that was applied.
 * @param preservedConstraints  Hard constraints preserved from the original.
 * @param conflicts             Any profile-vs-constraint conflicts (empty in Batch 2).
 * @param source                Whether enriched or original content was used.
 * @param counter               Monotonic counter for unique variant IDs.
 * @returns A complete PromptVariant object.
 */
export function mapToPromptVariant(
  generatedContent: string,
  profile: DirectionProfile,
  preservedConstraints: PreservedConstraintReference[],
  conflicts: VariantConflict[],
  source: "original" | "enriched",
  counter: number,
): PromptVariant {
  const variantId = `VAR_${profile.profileId}_${Date.now()}_${counter}`;
  const generatedAt = new Date().toISOString();

  // Edge case: empty generated content
  const isContentEmpty =
    !generatedContent || generatedContent.trim().length === 0;

  return {
    variantId,
    profileId: profile.profileId,
    label: profile.label,
    content: generatedContent || "",
    directionExplanation: profile.description,
    preservedConstraints,
    conflicts,
    assumptions: isContentEmpty
      ? ["Keine Änderung möglich — Original unverändert."]
      : [
          `Profil-Prefix "${profile.label}" wurde vorangestellt.`,
          "Keine Änderung an den Constraints des Original-Prompts.",
        ],
    openPoints: [],
    recommendation: profile.recommendation,
    metadata: {
      generatedAt,
      sourceContent: source,
      appliedProfileId: profile.profileId,
    },
  };
}

// =============================================================================
// Re-exports for convenience (profiles are the primary data source)
// =============================================================================

export { DIRECTION_PROFILES };
