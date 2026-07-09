// =============================================================================
// PromptVault Lite — Constraint Checker (Phase 1 — Basis)
// =============================================================================
// Detects hard constraints in prompt text and checks for conflicts with
// user answers (Missing-Info-Gate) or direction profiles (#215).
// Deterministic, regex/heuristic-based — no LLM, no network.
// Phase 1: Basis extraction + basic conflict detection.
// Phase 2 (#215): Direction profile compatibility matrix.
// =============================================================================

import type {
  HardConstraint,
  ConstraintConflict,
  ConstraintCategory,
  ConflictResolutionOption,
  MissingInfoAnswer,
} from "@/types";

// =============================================================================
// Constraint Extraction Patterns
// =============================================================================

interface ConstraintPattern {
  category: ConstraintCategory;
  severity: "hard" | "soft";
  /** Regex patterns (German + English). Case-insensitive. */
  patterns: RegExp[];
}

const CONSTRAINT_PATTERNS: ConstraintPattern[] = [
  {
    category: "offline_only",
    severity: "hard",
    patterns: [
      /keine\s+cloud\s+(?:verwenden|nutzen|einsetzen)/i,
      /nur\s+lokal\s+(?:ausführen|ausführbar|verarbeiten)/i,
      /no\s+cloud/i,
      /local\.only/i,
      /local-only/i,
      /offline/i,
      /nicht\s+(?:online|im\s+internet|im\s+netz)/i,
    ],
  },
  {
    category: "max_length",
    severity: "hard",
    patterns: [
      /maximal\s+(\d+)\s+(?:Wörter|Worte|Zeichen)\b/i,
      /max\.?\s+(\d+)\s+(?:Wörter|Worte|Zeichen)\b/i,
      /nicht\s+mehr\s+als\s+(\d+)\s+(?:Wörter|Worte|Zeichen)\b/i,
      /höchstens\s+(\d+)\s+(?:Wörter|Worte|Zeichen)\b/i,
      /max(?:imum)?\s+(\d+)\s+words/i,
      /at\s+most\s+(\d+)\s+words/i,
    ],
  },
  {
    category: "no_examples",
    severity: "soft",
    patterns: [
      /keine\s+beispiele/i,
      /ohne\s+beispiele/i,
      /no\s+examples/i,
      /keine\s+beispielprompts/i,
      /nicht\s+mit\s+beispielen/i,
    ],
  },
  {
    category: "language",
    severity: "hard",
    patterns: [
      /nur\s+auf\s+deutsch/i,
      /ausschließlich\s+auf\s+deutsch/i,
      /in\s+deutscher\s+sprache/i,
      /antwort\s+auf\s+deutsch/i,
      /nur\s+auf\s+englisch/i,
      /in\s+english/i,
      /only\s+in\s+(?:german|english)/i,
      /sprache\s*:\s*deutsch/i,
      /language\s*:\s*(?:german|english)/i,
    ],
  },
  {
    category: "format_lock",
    severity: "hard",
    patterns: [
      /als\s+json\s+(?:ausgeben|formatieren|format)/i,
      /im\s+json[.\s-]format/i,
      /als\s+markdown/i,
      /nur\s+als\s+(?:tabelle|liste|aufzählung)/i,
      /output\s+as\s+json/i,
    ],
  },
  {
    category: "tool_restriction",
    severity: "hard",
    patterns: [
      /keine?\s+(?:tools?|plugins?|erweiterungen?)\s+(?:verwenden|nutzen)/i,
      /nur\s+(?:git|shell|bash|node)\s+(?:verwenden|nutzen)/i,
      /ohne\s+(?:docker|npm|pip|apt)/i,
      /do\s+not\s+use\s+(?:docker|npm|pip)/i,
    ],
  },
  {
    category: "approval_required",
    severity: "hard",
    patterns: [
      /vor\s+der\s+ausführung\s+(?:bestätigen|prüfen|genehmigen)/i,
      /human\s+approval\s+required/i,
      /menschliche\s+(?:freigabe|genehmigung|prüfung)\s+(?:nötig|erforderlich)/i,
      /nicht\s+automatisch\s+(?:ausführen|deployen|mergen)/i,
      /review\s+(?:required|mandatory)/i,
    ],
  },
  {
    category: "scope_boundary",
    severity: "hard",
    patterns: [
      /nur\s+(?:diese|folgende)\s+datei(?:en)?\s+(?:ändern|bearbeiten)/i,
      /keine\s+neuen\s+dateien/i,
      /kein\s+refactoring/i,
      /scope\s*:\s*(?:nur|only)/i,
      /do\s+not\s+(?:modify|change|touch)\s+(?:other|unrelated)/i,
    ],
  },
];

// =============================================================================
// Extraction
// =============================================================================

let constraintIdCounter = 0;

function nextConstraintId(): string {
  constraintIdCounter += 1;
  return `HC_${String(constraintIdCounter).padStart(3, "0")}`;
}

/** Reset the counter (for test determinism). */
export function resetConstraintIdCounter(): void {
  constraintIdCounter = 0;
}

/**
 * Extract hard constraints from prompt text using regex/heuristic patterns.
 *
 * @param content  The prompt text to analyze.
 * @returns Array of detected HardConstraints. Empty array for empty input.
 */
export function extractHardConstraints(content: string): HardConstraint[] {
  if (!content || content.trim().length === 0) {
    return [];
  }

  const constraints: HardConstraint[] = [];

  for (const pattern of CONSTRAINT_PATTERNS) {
    for (const regex of pattern.patterns) {
      // Reset lastIndex for global regex (though we use non-global with match)
      let match: RegExpExecArray | null;
      const globalRegex = new RegExp(
        regex.source,
        regex.flags.includes("g") ? regex.flags : regex.flags + "g",
      );

      while ((match = globalRegex.exec(content)) !== null) {
        // Compute approximate line/column from match index
        const beforeMatch = content.slice(0, match.index);
        const line = beforeMatch.split("\n").length;
        const lastNewline = beforeMatch.lastIndexOf("\n");
        const column =
          match.index - (lastNewline >= 0 ? lastNewline + 1 : 0) + 1;

        constraints.push({
          id: nextConstraintId(),
          constraintText: match[0].trim(),
          category: pattern.category,
          severity: pattern.severity,
          position: { line, column },
        });

        // Prevent infinite loop on zero-length match
        if (match[0].length === 0) {
          globalRegex.lastIndex += 1;
        }
      }
    }
  }

  return constraints;
}

// =============================================================================
// Conflict Detection
// =============================================================================

/** Conflict detection rule: maps constraint categories to keywords in answers. */
interface ConflictRule {
  category: ConstraintCategory;
  /** Keywords in answers that trigger a conflict with this category. */
  conflictingKeywords: string[];
  /** Default conflict severity. */
  defaultSeverity: "blocking" | "warning";
}

const CONFLICT_RULES: ConflictRule[] = [
  {
    category: "offline_only",
    conflictingKeywords: [
      "cloud",
      "online",
      "remote",
      "api",
      "web service",
      "internet",
      "server",
      "saas",
    ],
    defaultSeverity: "blocking",
  },
  {
    category: "max_length",
    conflictingKeywords: [
      "ausführlich",
      "detailliert",
      "umfangreich",
      "lang",
      "comprehensive",
      "detailed",
      "long",
      "extensive",
    ],
    defaultSeverity: "warning",
  },
  {
    category: "language",
    conflictingKeywords: [
      "englisch",
      "english",
      "französisch",
      "french",
      "spanisch",
      "spanish",
    ],
    defaultSeverity: "blocking",
  },
  {
    category: "no_examples",
    conflictingKeywords: [
      "beispiel",
      "beispiele",
      "example",
      "examples",
      "muster",
      "vorlage",
      "template",
    ],
    defaultSeverity: "warning",
  },
  {
    category: "tool_restriction",
    conflictingKeywords: [
      "docker",
      "npm install",
      "pip install",
      "apt-get",
      "package",
    ],
    defaultSeverity: "blocking",
  },
  {
    category: "scope_boundary",
    conflictingKeywords: [
      "refactoring",
      "refactor",
      "umbau",
      "restructure",
      "rewrite",
    ],
    defaultSeverity: "blocking",
  },
];

/**
 * Generate resolution options for a given conflict.
 */
function buildResolutionOptions(
  constraint: HardConstraint,
  _conflictingSource: string,
): ConflictResolutionOption[] {
  return [
    {
      id: "keep_constraint",
      label: "Constraint behalten",
      description: `Die Regel "${constraint.constraintText}" bleibt erhalten. Die widersprechende Eingabe wird ignoriert oder angepasst.`,
      consequence:
        "Der Constraint wird beibehalten; die widersprechende Angabe wird nicht übernommen.",
    },
    {
      id: "change_constraint",
      label: "Constraint ändern",
      description: `Die Regel "${constraint.constraintText}" wird gelockert oder entfernt.`,
      consequence:
        "Der Constraint wird aufgehoben; die neue Angabe wird übernommen.",
    },
    {
      id: "save_as_review",
      label: "Als Review-Fall speichern",
      description:
        "Keine automatische Änderung. Der Konflikt wird für eine spätere manuelle Prüfung markiert.",
      consequence:
        "Keine Änderung am Prompt. Der Konflikt bleibt als offener Punkt erhalten.",
    },
  ];
}

/**
 * Check for conflicts between extracted constraints and user answers.
 *
 * @param constraints   Hard constraints extracted from the prompt.
 * @param answers       User answers from the Missing-Info-Gate.
 * @returns Array of ConstraintConflict objects. Empty if no conflicts.
 */
export function checkConflicts(
  constraints: HardConstraint[],
  answers: MissingInfoAnswer[],
): ConstraintConflict[] {
  if (!constraints.length || !answers.length) {
    return [];
  }

  const conflicts: ConstraintConflict[] = [];
  let conflictIdCounter = 0;

  for (const constraint of constraints) {
    // Find the matching conflict rule for this constraint category
    const rule = CONFLICT_RULES.find((r) => r.category === constraint.category);
    if (!rule) continue;

    for (const answer of answers) {
      const answerLower = answer.value.toLowerCase();

      // Check if answer contains any conflicting keyword
      const matchedKeyword = rule.conflictingKeywords.find((kw) =>
        answerLower.includes(kw.toLowerCase()),
      );

      if (matchedKeyword) {
        conflictIdCounter += 1;

        const description =
          constraint.severity === "hard"
            ? `Die Antwort "${answer.value}" kollidiert mit der harten Regel "${constraint.constraintText}".`
            : `Die Antwort "${answer.value}" steht im Konflikt mit der Regel "${constraint.constraintText}".`;

        conflicts.push({
          id: `CC_${String(conflictIdCounter).padStart(3, "0")}`,
          constraint,
          conflictingSource: answer.value,
          description,
          severity: rule.defaultSeverity,
          resolutions: buildResolutionOptions(constraint, answer.value),
          selectedResolution: null,
        });
      }
    }
  }

  return conflicts;
}
