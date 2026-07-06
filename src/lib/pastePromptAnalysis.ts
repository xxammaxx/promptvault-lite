// =============================================================================
// PromptVault Lite — Paste Prompt Analysis Adapter
// =============================================================================
// Pure TypeScript adapter that analyses pasted prompt text using existing
// local-only analysis functions. No file, no persistence, no cloud.
// =============================================================================

import { classifyContent, evaluateBlueprint } from "@/lib/blueprintDetection";
import { evaluatePromptContext } from "@/lib/promptContextEvaluation";
import type {
  BlueprintDetectOutput,
  BlueprintEvaluation,
  PromptContextEvaluation,
} from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PastePromptAnalysisInput {
  content: string;
}

export interface PastePromptAnalysisResult {
  contentLength: number;
  contentClass: BlueprintDetectOutput;
  contextEvaluation: PromptContextEvaluation;
  blueprintEvaluation: BlueprintEvaluation | null;
  warnings: string[];
  persisted: false;
}

export interface PasteValidationError {
  type: "VALIDATION_ERROR";
  message: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Warn when content exceeds this character count. */
const LARGE_CONTENT_WARNING_THRESHOLD = 50_000;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyse a pasted prompt without requiring a file in the vault.
 *
 * This function calls the existing local-only analysis pipeline:
 * 1. classifyContent() — content class, blueprint type, contamination
 * 2. evaluatePromptContext() — context engineering scores
 * 3. evaluateBlueprint() — if the content is blueprint-like
 *
 * No content is persisted. No file is needed. No cloud API is called.
 *
 * @returns PastePromptAnalysisResult on success, or PasteValidationError if
 *          the input is empty/whitespace-only.
 */
export function analyzePastedPrompt(
  input: PastePromptAnalysisInput,
): PastePromptAnalysisResult | PasteValidationError {
  const trimmed = input.content.trim();

  // --- Validation ---
  if (trimmed.length === 0) {
    return {
      type: "VALIDATION_ERROR",
      message:
        "Bitte füge einen Prompt-Text ein, bevor du die Analyse startest.",
    };
  }

  // --- Analyses ---
  const contentClass = classifyContent(trimmed);
  const contextEvaluation = evaluatePromptContext(trimmed);

  // Evaluate blueprint only when classification suggests it
  let blueprintEvaluation: BlueprintEvaluation | null = null;
  if (
    contentClass.content_class === "BLUEPRINT" ||
    contentClass.content_class === "PROMPT_BLUEPRINT_HYBRID" ||
    contentClass.content_class === "GUIDELINE"
  ) {
    blueprintEvaluation = evaluateBlueprint(trimmed);
  }

  // --- Warnings ---
  const warnings: string[] = [];

  // Large content warning
  if (trimmed.length > LARGE_CONTENT_WARNING_THRESHOLD) {
    warnings.push(
      `Der eingefügte Text ist sehr lang (${trimmed.length.toLocaleString()} Zeichen). Die Analyse kann etwas dauern.`,
    );
  }

  // Contamination warnings from blueprint detection
  if (contentClass.contamination_signals.length > 0) {
    warnings.push(
      `Kontaminationshinweise erkannt: ${contentClass.contamination_signals.join(", ")}.`,
    );
  }

  // Secret-like content warning
  if (contentClass.contamination_status === "BLOCKING_SENSITIVE_CONTENT") {
    warnings.push(
      "Der Text enthält möglicherweise sensible Daten (Secrets, PII). Keine Daten werden gespeichert.",
    );
  }

  return {
    contentLength: trimmed.length,
    contentClass,
    contextEvaluation,
    blueprintEvaluation,
    warnings,
    persisted: false,
  };
}
