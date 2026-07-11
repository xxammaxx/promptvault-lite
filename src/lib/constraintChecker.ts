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
  DirectionProfile,
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
// Deterministic ID Generation
// =============================================================================

/**
 * djb2 hash algorithm — simple, fast, deterministic.
 * Returns an 8-character uppercase hex string.
 * Same input always produces the same hash.
 */
function hashString(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
    hash = hash >>> 0; // force unsigned 32-bit
  }
  return hash.toString(16).padStart(8, "0").toUpperCase();
}

/**
 * Generate a deterministic constraint ID from category, text, and position.
 * Same input → same ID — idempotent, reproducible across calls.
 */
function generateConstraintId(
  category: ConstraintCategory,
  constraintText: string,
  line: number,
  column: number,
): string {
  const seed = `${category}:${constraintText}:${line}:${column}`;
  return `HC_${hashString(seed)}`;
}

// =============================================================================
// Extraction
// =============================================================================

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
          id: generateConstraintId(
            pattern.category,
            match[0].trim(),
            line,
            column,
          ),
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
    category: "approval_required",
    conflictingKeywords: [
      "automatisch",
      "automatic",
      "auto-deploy",
      "deployen",
      "ohne freigabe",
      "ohne genehmigung",
      "ohne review",
      "skip review",
      "auto-merge",
    ],
    defaultSeverity: "blocking",
  },
  {
    category: "format_lock",
    conflictingKeywords: [
      "markdown",
      "plain text",
      "csv",
      "yaml",
      "xml",
      "html",
      "text",
    ],
    defaultSeverity: "warning",
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
 * Security-critical constraint categories.
 * For these, a silent "change_constraint" is NOT allowed.
 * The user must explicitly request human approval before weakening.
 */
const SECURITY_CATEGORIES: Set<ConstraintCategory> = new Set([
  "offline_only",
  "approval_required",
  "scope_boundary",
]);

/**
 * Generate resolution options for a given conflict.
 *
 * Security categories (offline_only, approval_required, scope_boundary)
 * get hardened options: "change_constraint" is replaced by
 * "require_human_approval" to prevent silent weakening of security rules.
 *
 * Non-security categories keep the standard "change_constraint" option.
 */
function buildResolutionOptions(
  constraint: HardConstraint,
  _conflictingSource: string,
): ConflictResolutionOption[] {
  const isSecurityCritical = SECURITY_CATEGORIES.has(constraint.category);

  const options: ConflictResolutionOption[] = [
    {
      id: "keep_constraint",
      label: "Constraint behalten",
      description: isSecurityCritical
        ? `Die Sicherheitsregel "${constraint.constraintText}" bleibt zwingend erhalten. Die widersprechende Eingabe wird ignoriert oder angepasst.`
        : `Die Regel "${constraint.constraintText}" bleibt erhalten. Die widersprechende Eingabe wird ignoriert oder angepasst.`,
      consequence:
        "Der Constraint wird beibehalten; die widersprechende Angabe wird nicht übernommen.",
    },
  ];

  if (isSecurityCritical) {
    // Security categories: require human approval instead of silent change
    options.push({
      id: "require_human_approval",
      label: "Menschliche Freigabe erforderlich",
      description: `Die Änderung des Sicherheits-Constraints "${constraint.constraintText}" erfordert eine explizite menschliche Prüfung und Freigabe. Eine automatische Aufweichung ist nicht zulässig.`,
      consequence:
        "Der Constraint bleibt vorerst erhalten. Eine manuelle Überprüfung und explizite Freigabe durch eine autorisierte Person ist erforderlich, bevor er geändert werden kann.",
    });
  } else {
    // Non-security categories: allow direct constraint modification
    options.push({
      id: "change_constraint",
      label: "Constraint ändern",
      description: `Die Regel "${constraint.constraintText}" wird gelockert oder entfernt.`,
      consequence:
        "Der Constraint wird aufgehoben; die neue Angabe wird übernommen.",
    });
  }

  // Always available: defer to manual review
  options.push({
    id: "save_as_review",
    label: "Als Review-Fall speichern",
    description:
      "Keine automatische Änderung. Der Konflikt wird für eine spätere manuelle Prüfung markiert.",
    consequence:
      "Keine Änderung am Prompt. Der Konflikt bleibt als offener Punkt erhalten.",
  });

  return options;
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

// =============================================================================
// Direction Profile Conflict Detection (Phase 2 — #215 Batch 3)
// =============================================================================

/**
 * Check direction profile compatibility against extracted hard constraints.
 *
 * Uses the profile's `conflictingConstraintCategories` as the primary conflict
 * detector. Security-critical categories (offline_only, approval_required,
 * scope_boundary) produce BLOCKING conflicts with `require_human_approval`
 * resolution options. Non-security categories produce WARNING conflicts.
 *
 * The original prompt content is NEVER modified by this function — it is a
 * pure detector that only returns conflict data.
 *
 * @param profile       The selected DirectionProfile to check.
 * @param constraints   Hard constraints extracted from the prompt.
 * @returns Array of ConstraintConflict objects. Empty if fully compatible.
 */
export function checkDirectionProfileConflicts(
  profile: DirectionProfile,
  constraints: HardConstraint[],
): ConstraintConflict[] {
  if (!constraints.length) {
    return [];
  }

  const conflicts: ConstraintConflict[] = [];
  let conflictIdCounter = 0;

  for (const constraint of constraints) {
    const category = constraint.category;

    // Check if this constraint category conflicts with the profile
    const isConflicting =
      profile.conflictingConstraintCategories.includes(category);

    if (!isConflicting) {
      // No conflict — profile is compatible with this constraint
      continue;
    }

    conflictIdCounter += 1;

    // Security-critical categories → BLOCKING
    // Non-security categories → WARNING
    const isSecurityCategory = SECURITY_CATEGORIES.has(category);
    const severity: "blocking" | "warning" = isSecurityCategory
      ? "blocking"
      : "warning";

    // Build human-readable conflict description
    const description = isSecurityCategory
      ? `Das Profil "${profile.label}" steht im Konflikt mit der Sicherheitsregel "${constraint.constraintText}". ` +
        `Sicherheitsregeln können nicht automatisch abgeschwächt werden. Die Regel bleibt zwingend erhalten.`
      : `Das Profil "${profile.label}" kollidiert mit der Regel "${constraint.constraintText}". ` +
        `Die Regel bleibt erhalten, was die Profil-Wirkung einschränken kann.`;

    conflicts.push({
      id: `DPC_${String(conflictIdCounter).padStart(3, "0")}`,
      constraint,
      conflictingSource: profile.label,
      description,
      severity,
      resolutions: buildResolutionOptions(constraint, profile.label),
      selectedResolution: null,
    });
  }

  return conflicts;
}
