// =============================================================================
// PromptVault Lite — Missing-Info-Detector
// =============================================================================
// Detects information gaps from existing analysis pipeline output.
// No own prompt analysis — only transforms existing evaluation data.
// Deterministic, pure functions — no network, no side effects.
// =============================================================================

import type {
  MissingInfoItem,
  MissingInfoInputType,
  MissingInfoSource,
  PromptContextEvaluation,
  PromptHygiene,
  BlueprintEvaluation,
} from "@/types";

// =============================================================================
// Types
// =============================================================================

/** Input bundle consumed by the detector. */
export interface AnalysisInput {
  contextEval: PromptContextEvaluation;
  hygiene: PromptHygiene;
  blueprintEval?: BlueprintEvaluation;
  /** Optional: original prompt content length for edge-case checks. */
  promptContentLength?: number;
  /** Optional: contamination override (when known from external context). */
  contaminationStatusOverride?: string;
}

// =============================================================================
// Helpers
// =============================================================================

/** Normalize a label string for deduplication: lowercase, collapsed whitespace. */
function normalizeLabel(label: string): string {
  return label.toLowerCase().trim().replace(/\s+/g, " ");
}

/** Generate an ID with a sequential counter per source prefix. */
function makeId(source: MissingInfoSource, counter: number): string {
  const prefix = source.slice(0, 3).toUpperCase();
  return `MISS_${prefix}_${String(counter).padStart(3, "0")}`;
}

/** Determine a reasonable inputType for a given risk flag. */
function inputTypeForRiskFlag(_flag: string): MissingInfoInputType {
  return "free_text";
}

/** Map a missing element label to a German question string. */
function questionForMissingElement(label: string): string {
  const qMap: Record<string, string> = {
    zieldefinition: "Was ist das Ziel dieses Prompts?",
    zielgruppe: "Wer ist die Zielgruppe dieses Prompts?",
    ausgabeformat: "In welchem Format soll die Ausgabe erfolgen?",
    constraints: "Welche Constraints oder Einschränkungen gelten?",
    kontext: "Welcher Kontext oder Hintergrund ist relevant?",
    quellenangaben: "Welche Quellen sollen verwendet werden?",
    annahmen: "Welche Annahmen liegen zugrunde?",
    sicherheitsregeln: "Welche Sicherheits- oder Datenschutzregeln gelten?",
    toolauswahl: "Welche Tools sind erlaubt oder ausgeschlossen?",
    versionsangaben: "Welche Versionen oder Stände sind relevant?",
  };
  const key = normalizeLabel(label);
  return qMap[key] || `Bitte ergänzen: ${label}`;
}

/** Deduplicate items by normalized label, keeping the first occurrence. */
function deduplicate(items: MissingInfoItem[]): MissingInfoItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const norm = normalizeLabel(item.label);
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });
}

// =============================================================================
// Edge-Case Guards
// =============================================================================

/**
 * Returns true if the prompt should NOT trigger any gate questions.
 * Reasons: empty/whitespace content, BLOCKING_SENSITIVE_CONTENT, score > 95.
 */
function shouldSuppressGate(input: AnalysisInput): boolean {
  // Empty / whitespace prompt
  if (
    input.promptContentLength !== undefined &&
    input.promptContentLength === 0
  ) {
    return true;
  }

  // BLOCKING_SENSITIVE_CONTENT
  const contamination =
    input.contaminationStatusOverride ??
    input.blueprintEval?.contamination_status;
  if (contamination === "BLOCKING_SENSITIVE_CONTENT") {
    return true;
  }

  return false;
}

/**
 * Determine whether items should be restricted based on prompt quality.
 */
function maxItemsForScore(input: AnalysisInput): number {
  const score = input.contextEval.overall_score;

  // Score > 95: only OPTIONAL questions allowed
  if (score > 95) return 0; // will be filtered by classifier

  // Prompt < 50 chars: no over-engineering, max 3 items
  if (
    input.promptContentLength !== undefined &&
    input.promptContentLength < 50
  ) {
    return 3;
  }

  return Infinity; // no restriction
}

// =============================================================================
// Core Detector
// =============================================================================

/**
 * Detect information gaps from existing analysis pipeline output.
 *
 * Consumes:
 * - contextEval.missing_elements[] → MissingInfoItem (source: prompt_engineering)
 * - contextEval.risk_flags[] → MissingInfoItem (source: risk_flag)
 * - contextEval.criteria[score===0] → MissingInfoItem (source varies by dimension)
 * - contextEval.suggested_improvements[] → MissingInfoItem (source varies)
 * - blueprintEval?.missing_elements[] → MissingInfoItem (source: blueprint)
 * - hygiene.hygiene_score < 50 → MissingInfoItem (source: hygiene)
 *
 * @param input  Analysis output bundle from the existing pipeline.
 * @returns Deduplicated array of MissingInfoItem, or empty array if suppressed.
 */
export function detectGaps(input: AnalysisInput): MissingInfoItem[] {
  // --- Edge-Case Guards ---
  if (shouldSuppressGate(input)) {
    return [];
  }

  const items: MissingInfoItem[] = [];
  let counter = 0;

  const nextId = (source: MissingInfoSource): string => {
    counter += 1;
    return makeId(source, counter);
  };

  // --- missing_elements[] from PromptContextEvaluation ---
  for (const element of input.contextEval.missing_elements) {
    const label = element.trim();
    if (!label) continue;
    items.push({
      id: nextId("prompt_engineering"),
      source: "prompt_engineering",
      label,
      question: questionForMissingElement(label),
      rationale: "Dieses Element fehlt in der Prompt-Analyse.",
      inputType: "free_text",
    });
  }

  // --- risk_flags[] ---
  for (const flag of input.contextEval.risk_flags) {
    items.push({
      id: nextId("risk_flag"),
      source: "risk_flag",
      label: flag.flag,
      question: flag.message,
      rationale: `Risiko (${flag.severity}): ${flag.message}`,
      inputType: inputTypeForRiskFlag(flag.flag),
    });
  }

  // --- criteria[] with score === 0 ---
  for (const criterion of input.contextEval.criteria) {
    if (criterion.score !== 0) continue;
    const source: MissingInfoSource =
      criterion.dimension === "agent_readiness"
        ? "agent_readiness"
        : criterion.dimension === "context_engineering"
          ? "context_engineering"
          : "prompt_engineering";

    items.push({
      id: nextId(source),
      source,
      label: criterion.name,
      question: `Das Kriterium "${criterion.name}" wurde mit 0 bewertet. ${criterion.details || "Bitte ergänzen Sie die fehlenden Informationen."}`,
      rationale: `Kriterium "${criterion.name}" hat Score 0/${criterion.max_score}.`,
      inputType: "free_text",
    });
  }

  // --- suggested_improvements[] ---
  for (const improvement of input.contextEval.suggested_improvements) {
    const source: MissingInfoSource =
      improvement.dimension === "agent_readiness"
        ? "agent_readiness"
        : improvement.dimension === "context_engineering"
          ? "context_engineering"
          : "prompt_engineering";

    items.push({
      id: nextId(source),
      source,
      label: improvement.criterion,
      question: improvement.message,
      rationale: `Verbesserungsvorschlag (${improvement.priority}): ${improvement.message}`,
      inputType: "free_text",
    });
  }

  // --- blueprintEval?.missing_elements[] ---
  if (input.blueprintEval?.missing_elements) {
    for (const element of input.blueprintEval.missing_elements) {
      const label = element.trim();
      if (!label) continue;
      items.push({
        id: nextId("blueprint"),
        source: "blueprint",
        label,
        question: questionForMissingElement(label),
        rationale: "Dieses Element fehlt im Blueprint.",
        inputType: "free_text",
      });
    }
  }

  // --- hygiene_score < 50 ---
  if (input.hygiene.hygiene_score < 50) {
    items.push({
      id: nextId("hygiene"),
      source: "hygiene",
      label: "Artefaktbereinigung",
      question:
        "Der Prompt enthält Artefakte. Sollen diese vor der Optimierung bereinigt werden?",
      rationale: `Hygiene-Score ist niedrig (${input.hygiene.hygiene_score}).`,
      inputType: "boolean",
    });
  }

  // --- Deduplicate ---
  const deduped = deduplicate(items);

  // --- Limit based on prompt size (edge case) ---
  const maxItems = maxItemsForScore(input);
  if (maxItems < deduped.length) {
    return deduped.slice(0, maxItems);
  }

  return deduped;
}
