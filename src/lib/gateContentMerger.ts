// =============================================================================
// PromptVault Lite — Gate Content Merger (Phase 1 — Batch 2)
// =============================================================================
// Merges sanitized user answers from the Missing-Info-Gate into the original
// prompt content as a Markdown section.
//
// Security-critical: sanitizes all user input before merge to prevent
// Markdown injection, XSS, code-block injection, and prompt manipulation.
//
// Pure functions — no side effects, no Store/UI/Optimizer dependencies.
// Only imports from @/types. Deterministic: same inputs → same outputs.
// =============================================================================

import type {
  MissingInfoAnswer,
  ClassifiedMissingInfo,
  GateOutcome,
} from "@/types";

// =============================================================================
// Constants
// =============================================================================

/** Maximum length of a single sanitized answer. */
const MAX_ANSWER_LENGTH = 5000;

/** The heading for the merged answer section. */
const MERGE_SECTION_HEADING = "## Ergänzte Informationen (Missing-Info-Gate)";

/** Categories of control characters: preserve newlines/tabs, strip the rest. */
const PRESERVED_CONTROL_CHARS = new Set([0x09, 0x0a, 0x0d]); // tab, LF, CR

// =============================================================================
// Types
// =============================================================================

/** Result of merging answers into the original content. */
export interface GateMergeResult {
  /** The original content with the merged answer section appended (or unchanged). */
  enrichedContent: string;
  /** How many items were explicitly answered (non-empty value). */
  answeredCount: number;
  /** How many items were filled by assumptions (only when outcome is ASSUMPTIONS). */
  assumedCount: number;
  /** How many items were explicitly skipped. */
  skippedCount: number;
  /** Whether constraint conflicts exist (set by the caller, not computed here). */
  hasConflicts: boolean;
}

// =============================================================================
// Sanitization
// =============================================================================

/**
 * Sanitize a user answer before merging it into the prompt content.
 *
 * Applies 8 sanitization rules in order:
 * 1. Strip Markdown headings (# through ######)
 * 2. Strip HTML tags (script, img, iframe, event handlers, etc.)
 * 3. Escape unescaped backticks (prevents code-block injection)
 * 4. Neutralize dangerous Markdown links (javascript:, data: URIs)
 * 5. Normalize control characters (preserve newlines/tabs, strip others)
 * 6. Collapse multiple blank lines
 * 7. Trim leading/trailing whitespace
 * 8. Truncate to MAX_ANSWER_LENGTH
 *
 * Preserves: German umlauts (äöüßÄÖÜ), regular text, technical terms.
 *
 * @param value  The raw user answer.
 * @returns Sanitized answer string. Empty string for empty/whitespace input.
 */
export function sanitizeAnswer(value: string): string {
  if (!value) return "";

  let sanitized = value;

  // 1. Strip Markdown headings (all levels # through ######)
  //    This prevents section-injection into the prompt content.
  sanitized = sanitized.replace(/^#{1,6}\s+/gm, "");

  // 2. Strip HTML tags and event handlers
  //    Removes: <script>, <img>, <iframe>, <style>, <object>, <embed>,
  //    <svg>, <math>, <link>, <meta>, event handlers (on*=)
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // 3. Escape unescaped backticks
  //    Prevents code-block injection: `code` becomes \`code\`
  sanitized = sanitized.replace(/(?<!\\)`/g, "\\`");

  // 4. Neutralize dangerous Markdown link injections
  //    [text](javascript:...) and [text](data:...) become [text]
  //    Handles one level of nested parentheses within the URI.
  sanitized = sanitized.replace(
    /\[([^\]]*)\]\((javascript|data):(?:[^()]|\([^()]*\))*\)/gi,
    "[$1]",
  );

  // 5. Normalize control characters
  //    Preserve: tab (0x09), LF (0x0a), CR (0x0d)
  //    Strip: null bytes and other control chars (0x00–0x1F, 0x7F)
  //    Preserve: all printable chars, umlauts, Unicode above U+0080
  const normalized = new Array<string>(sanitized.length);
  for (let i = 0; i < sanitized.length; i++) {
    const code = sanitized.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) {
      normalized.push(PRESERVED_CONTROL_CHARS.has(code) ? sanitized[i] : "");
    } else {
      normalized.push(sanitized[i]);
    }
  }
  sanitized = normalized.join("");

  // 6. Collapse multiple consecutive blank lines into a single blank line
  sanitized = sanitized.replace(/\n{3,}/g, "\n\n");

  // 7. Trim leading and trailing whitespace
  sanitized = sanitized.trim();

  // 8. Limit length
  if (sanitized.length > MAX_ANSWER_LENGTH) {
    sanitized = sanitized.slice(0, MAX_ANSWER_LENGTH) + "…";
  }

  return sanitized;
}

// =============================================================================
// Merge
// =============================================================================

/**
 * Options controlling merge behavior.
 */
export interface MergeOptions {
  /** IDs of items the user explicitly skipped (vs. never interacted with). */
  skippedItemIds?: Set<string>;
  /** Whether constraint conflicts were detected (set by caller). */
  hasConflicts?: boolean;
}

/**
 * Merge sanitized user answers into the original prompt content.
 *
 * Creates a Markdown section "## Ergänzte Informationen (Missing-Info-Gate)"
 * appended after the original content. The original content is never mutated.
 *
 * Behavior by outcome:
 * - SKIPPED:    Returns original content unchanged. No section added.
 * - COMPLETED:  Appends section with answered items. Skipped items marked.
 * - ASSUMPTIONS: Appends section with all answered items marked "(Annahme)".
 *
 * @param originalContent  The original prompt text (read-only, never mutated).
 * @param answers          User answers from the Missing-Info-Gate.
 * @param items            All classified missing-info items (for labels).
 * @param gateOutcome      How the gate session ended.
 * @param options          Merge options (skip semantics, conflict flag).
 * @returns GateMergeResult with enriched content and counts.
 */
export function mergeAnswers(
  originalContent: string,
  answers: MissingInfoAnswer[],
  items: ClassifiedMissingInfo[],
  gateOutcome: GateOutcome,
  options: MergeOptions = {},
): GateMergeResult {
  const { skippedItemIds = new Set<string>(), hasConflicts = false } = options;

  // SKIPPED outcome: no enrichment, original content unchanged
  if (gateOutcome === "SKIPPED") {
    return {
      enrichedContent: originalContent,
      answeredCount: 0,
      assumedCount: 0,
      skippedCount: skippedItemIds.size,
      hasConflicts,
    };
  }

  // Build an answer lookup map (itemId → sanitized value)
  const answerMap = new Map<string, string>();
  for (const answer of answers) {
    if (answer.value && answer.value.trim()) {
      answerMap.set(answer.itemId, sanitizeAnswer(answer.value));
    }
  }

  // Build the merge section line by line
  const lines: string[] = [];
  let answeredCount = 0;
  let assumedCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    const sanitized = answerMap.get(item.id);

    if (sanitized && sanitized.length > 0) {
      // Answered item
      answeredCount++;
      const suffix = gateOutcome === "ASSUMPTIONS" ? " _(Annahme)_" : "";
      lines.push(`- **${item.label}:** ${sanitized}${suffix}`);
    } else if (skippedItemIds.has(item.id)) {
      // Explicitly skipped item
      skippedCount++;
      lines.push(`- **${item.label}:** *übersprungen*`);
    }
    // else: item was not interacted with — silently omitted
  }

  // If nothing to add, return original unchanged
  if (lines.length === 0) {
    return {
      enrichedContent: originalContent,
      answeredCount: 0,
      assumedCount: gateOutcome === "ASSUMPTIONS" ? answeredCount : 0,
      skippedCount,
      hasConflicts,
    };
  }

  // Compute assumedCount: when ASSUMPTIONS, all answered items are assumptions
  if (gateOutcome === "ASSUMPTIONS") {
    assumedCount = answeredCount;
  }

  // Build enriched content: original + blank line + section heading + answers
  const section = [MERGE_SECTION_HEADING, ...lines].join("\n");
  const enrichedContent = originalContent.trimEnd() + "\n\n" + section + "\n";

  return {
    enrichedContent,
    answeredCount,
    assumedCount,
    skippedCount,
    hasConflicts,
  };
}
