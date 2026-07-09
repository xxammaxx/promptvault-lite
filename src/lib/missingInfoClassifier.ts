// =============================================================================
// PromptVault Lite — Missing-Info-Classifier
// =============================================================================
// Assigns tiers (REQUIRED / RECOMMENDED / OPTIONAL) to detected gaps
// and applies max limits with sort order.
// Deterministic, pure function — no side effects.
// =============================================================================

import type {
  MissingInfoItem,
  ClassifiedMissingInfo,
  MissingInfoCategory,
} from "@/types";

// =============================================================================
// Constants
// =============================================================================

/** Maximum visible REQUIRED items (overflow hidden behind expander). */
const MAX_REQUIRED = 5;

/** Maximum RECOMMENDED items. */
const MAX_RECOMMENDED = 7;

/** Maximum OPTIONAL items. */
const MAX_OPTIONAL = 10;

// =============================================================================
// Classification Rules (spec.md Section 4.2)
// =============================================================================

/**
 * Classification context carried alongside each item so the classifier can
 * access the original evaluation metadata needed for tier decisions.
 */
export interface ClassificationContext {
  /** Source dimension of the item. */
  source: MissingInfoItem["source"];
  /** Original risk flag severity (if applicable). */
  riskSeverity?: string;
  /** Original criterion score (if applicable). */
  criterionScore?: number;
  /** Original criterion dimension (if applicable). */
  criterionDimension?: string;
  /** Whether the prompt type is "simple_prompt". */
  isSimplePrompt?: boolean;
  /** Whether the prompt type is "agentic_prompt". */
  isAgenticPrompt?: boolean;
  /** Whether the context profile is "minimal". */
  isMinimalContext?: boolean;
  /** Hygiene score. */
  hygieneScore?: number;
  /** Improvement priority (if applicable). */
  improvementPriority?: string;
}

/**
 * Classify a single MissingInfoItem with its context.
 */
function classifyItem(
  item: MissingInfoItem,
  ctx: ClassificationContext,
): ClassifiedMissingInfo {
  let tier: MissingInfoCategory = "OPTIONAL";
  let reason = "Standard: keine spezifische Regel → OPTIONAL";

  // --- REQUIRED Rules ---

  // risk_flags[severity=critical] → REQUIRED
  if (ctx.source === "risk_flag" && ctx.riskSeverity === "critical") {
    tier = "REQUIRED";
    reason = "Risk flag severity is critical → REQUIRED";
  }

  // risk_flags[severity=high] → REQUIRED
  else if (ctx.source === "risk_flag" && ctx.riskSeverity === "high") {
    tier = "REQUIRED";
    reason = "Risk flag severity is high → REQUIRED";
  }

  // PE-Kriterien score===0 + detected_prompt_type !== "simple_prompt" → REQUIRED
  else if (
    ctx.source === "prompt_engineering" &&
    ctx.criterionScore === 0 &&
    !ctx.isSimplePrompt &&
    ctx.criterionDimension === "prompt_engineering"
  ) {
    tier = "REQUIRED";
    reason = "PE criterion score is 0 and prompt is not simple → REQUIRED";
  }

  // AR-Kriterien score===0 + detected_prompt_type === "agentic_prompt" → REQUIRED
  else if (
    ctx.source === "agent_readiness" &&
    ctx.criterionScore === 0 &&
    ctx.isAgenticPrompt
  ) {
    tier = "REQUIRED";
    reason = "AR criterion score is 0 and prompt is agentic → REQUIRED";
  }

  // --- RECOMMENDED Rules ---

  // risk_flags[severity=medium] → RECOMMENDED
  else if (ctx.source === "risk_flag" && ctx.riskSeverity === "medium") {
    tier = "RECOMMENDED";
    reason = "Risk flag severity is medium → RECOMMENDED";
  }

  // CE-Kriterien score===0 + detected_context_profile === "minimal" → RECOMMENDED
  else if (
    ctx.source === "context_engineering" &&
    ctx.criterionScore === 0 &&
    ctx.isMinimalContext
  ) {
    tier = "RECOMMENDED";
    reason = "CE criterion score is 0 and context is minimal → RECOMMENDED";
  }

  // Blueprint missing_elements → RECOMMENDED
  else if (ctx.source === "blueprint") {
    tier = "RECOMMENDED";
    reason = "Blueprint missing element → RECOMMENDED";
  }

  // hygiene_score < 50 → RECOMMENDED
  else if (
    ctx.source === "hygiene" &&
    ctx.hygieneScore !== undefined &&
    ctx.hygieneScore < 50
  ) {
    tier = "RECOMMENDED";
    reason = `Hygiene score is low (${ctx.hygieneScore}) → RECOMMENDED`;
  }

  // --- OPTIONAL Rules ---

  // PE-Kriterien score===1 → OPTIONAL
  else if (ctx.source === "prompt_engineering" && ctx.criterionScore === 1) {
    tier = "OPTIONAL";
    reason = "PE criterion score is 1 → OPTIONAL";
  }

  // CE-Kriterien score===1 → OPTIONAL
  else if (ctx.source === "context_engineering" && ctx.criterionScore === 1) {
    tier = "OPTIONAL";
    reason = "CE criterion score is 1 → OPTIONAL";
  }

  // risk_flags[severity=low] → OPTIONAL
  else if (ctx.source === "risk_flag" && ctx.riskSeverity === "low") {
    tier = "OPTIONAL";
    reason = "Risk flag severity is low → OPTIONAL";
  }

  // suggested_improvements → OPTIONAL
  else if (ctx.improvementPriority !== undefined) {
    tier = "OPTIONAL";
    reason = "Suggested improvement → OPTIONAL";
  }

  return {
    ...item,
    tier,
    classificationReason: reason,
  };
}

// =============================================================================
// Tier Priority for Sorting
// =============================================================================

const TIER_ORDER: Record<MissingInfoCategory, number> = {
  REQUIRED: 0,
  RECOMMENDED: 1,
  OPTIONAL: 2,
};

/**
 * Sort classified items: REQUIRED first, then RECOMMENDED, then OPTIONAL.
 * Within each tier, items maintain their original relative order (stable sort).
 */
function sortByTier(items: ClassifiedMissingInfo[]): ClassifiedMissingInfo[] {
  return [...items].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
}

/**
 * Apply max limits per tier and return the truncated array.
 * Overflow is NOT returned — the caller can compute it from the original array.
 */
function applyLimits(items: ClassifiedMissingInfo[]): ClassifiedMissingInfo[] {
  const result: ClassifiedMissingInfo[] = [];
  let requiredCount = 0;
  let recommendedCount = 0;
  let optionalCount = 0;

  for (const item of items) {
    switch (item.tier) {
      case "REQUIRED": {
        if (requiredCount < MAX_REQUIRED) {
          result.push(item);
          requiredCount++;
        }
        // else: overflow — item is dropped (caller can detect via count mismatch)
        break;
      }
      case "RECOMMENDED": {
        if (recommendedCount < MAX_RECOMMENDED) {
          result.push(item);
          recommendedCount++;
        }
        break;
      }
      case "OPTIONAL": {
        if (optionalCount < MAX_OPTIONAL) {
          result.push(item);
          optionalCount++;
        }
        break;
      }
    }
  }

  return result;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Result of classification including overflow counts for
 * each tier (so the UI can show "Weitere erforderliche Angaben (X)").
 */
export interface ClassificationResult {
  /** Classified, sorted, and limit-applied items. */
  items: ClassifiedMissingInfo[];
  /** How many REQUIRED items were dropped due to the limit. */
  requiredOverflow: number;
  /** How many RECOMMENDED items were dropped due to the limit. */
  recommendedOverflow: number;
  /** How many OPTIONAL items were dropped due to the limit. */
  optionalOverflow: number;
}

/**
 * Classify an array of MissingInfoItems.
 *
 * Applies classification rules from spec.md Section 4.2,
 * sorts REQUIRED → RECOMMENDED → OPTIONAL,
 * and applies max limits (5 REQUIRED / 7 RECOMMENDED / 10 OPTIONAL).
 *
 * @param items        Raw detected gaps.
 * @param contextMap   Optional map from item.id to ClassificationContext.
 *                     If omitted, all items default to OPTIONAL.
 * @returns ClassificationResult with sorted, limited items and overflow counts.
 */
export function classify(
  items: MissingInfoItem[],
  contextMap?: Record<string, ClassificationContext>,
): ClassificationResult {
  // Classify each item
  const classified: ClassifiedMissingInfo[] = items.map((item) => {
    const ctx = contextMap?.[item.id] ?? {
      source: item.source,
    };
    return classifyItem(item, ctx);
  });

  // Count total per tier before limiting
  const totalRequired = classified.filter((i) => i.tier === "REQUIRED").length;
  const totalRecommended = classified.filter(
    (i) => i.tier === "RECOMMENDED",
  ).length;
  const totalOptional = classified.filter((i) => i.tier === "OPTIONAL").length;

  // Sort
  const sorted = sortByTier(classified);

  // Apply limits
  const limited = applyLimits(sorted);

  // Compute overflow
  const limitedRequired = limited.filter((i) => i.tier === "REQUIRED").length;
  const limitedRecommended = limited.filter(
    (i) => i.tier === "RECOMMENDED",
  ).length;
  const limitedOptional = limited.filter((i) => i.tier === "OPTIONAL").length;

  return {
    items: limited,
    requiredOverflow: totalRequired - limitedRequired,
    recommendedOverflow: totalRecommended - limitedRecommended,
    optionalOverflow: totalOptional - limitedOptional,
  };
}
