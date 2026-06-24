import type {
  OptimizationDiff,
  OptimizationChange,
  OptimizationMode,
  OptimizationQualityResult,
} from "@/types";

// =============================================================================
// Prompt Optimization Engine — Deterministic, local, no-network
// =============================================================================

// Known section heading patterns (German + English), canonical order
const CANONICAL_SECTIONS = [
  { key: "role", patterns: [/Rolle|Rollendefinition|Role Definition|Role/i] },
  { key: "context", patterns: [/Kontext|Kontextqualität|Context/i] },
  { key: "goal", patterns: [/Ziel|Zieldefinition|Goal|Objective/i] },
  { key: "requirements", patterns: [/Anforderung|Requirements/i] },
  {
    key: "constraints",
    patterns: [/Einschränkung|Constraint|Grenze|Boundary|Limitation/i],
  },
  {
    key: "output",
    patterns: [/Output|Ausgabeformat|Output Format|Ergebnis|Result/i],
  },
  {
    key: "verify",
    patterns: [/Verif(?:ication|izierung)|Prüfung|Acceptance|Akzeptanz/i],
  },
];

function detectSectionFromHeading(heading: string): string | null {
  const cleaned = heading
    .replace(/^#{1,3}\s*/, "")
    .trim()
    .toLowerCase();
  for (const sec of CANONICAL_SECTIONS) {
    for (const pat of sec.patterns) {
      pat.lastIndex = 0;
      if (pat.test(cleaned)) return sec.key;
    }
  }
  return null;
}

function getCanonicalSectionName(key: string): string {
  const names: Record<string, string> = {
    role: "## Rollendefinition",
    context: "## Kontext",
    goal: "## Ziel",
    requirements: "## Anforderungen",
    constraints: "## Einschränkungen / Constraints",
    output: "## Ausgabeformat",
    verify: "## Verifikation / Acceptance Criteria",
  };
  return names[key] || `## ${key}`;
}

// =============================================================================
// Fenced code block handling
// =============================================================================

/**
 * Extracts fenced code blocks, replacing them with placeholders.
 * Returns the placeholder-filled text and the extracted blocks.
 * Placeholder format: __CODEBLOCK_0__, __CODEBLOCK_1__, ...
 */
function extractCodeBlocks(text: string): {
  processed: string;
  blocks: string[];
} {
  const blocks: string[] = [];
  // Match fenced code blocks: ``` optional language, content, then ```
  const fenceRegex = /^```[\s\S]*?^```/gm;
  let processed = text;
  let idx = 0;

  processed = processed.replace(fenceRegex, (match) => {
    const placeholder = `__CODEBLOCK_${idx}__`;
    blocks.push(match);
    idx++;
    return placeholder;
  });

  return { processed, blocks };
}

function restoreCodeBlocks(text: string, blocks: string[]): string {
  let result = text;
  for (let i = 0; i < blocks.length; i++) {
    result = result.replace(`__CODEBLOCK_${i}__`, () => blocks[i]);
  }
  return result;
}

// =============================================================================
// Mode: conservative — light cleanup
// =============================================================================

function conservativeOptimize(input: string): OptimizationDiff {
  const changes: OptimizationChange[] = [];

  // Guard: empty input
  if (input.trim().length === 0) {
    return {
      original: input,
      optimized: "",
      changes: [],
      warnings: ["Input ist leer — keine Optimierung möglich."],
    };
  }

  const { processed, blocks } = extractCodeBlocks(input);

  let lines = processed.split("\n");

  // 1. Trim trailing whitespace per line
  const trimmedLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].replace(/[ \t]+$/, "");
    if (trimmed !== lines[i]) {
      changes.push({
        type: "whitespace",
        description: `Zeile ${i + 1}: Leerzeichen am Zeilenende entfernt`,
      });
    }
    trimmedLines.push(trimmed);
  }
  lines = trimmedLines;

  // 2. Collapse multiple blank lines (more than 1 blank line → max 1 blank line)
  const collapsedLines: string[] = [];
  let lastWasBlank = false;
  for (const line of lines) {
    const isBlank = line.trim() === "";
    if (isBlank && lastWasBlank) continue; // skip consecutive blank lines
    collapsedLines.push(line);
    lastWasBlank = isBlank;
  }
  if (collapsedLines.length < lines.length) {
    changes.push({
      type: "whitespace",
      description: "Mehrfache Leerzeilen zu einer reduziert",
    });
  }
  lines = collapsedLines;

  // 3. Normalize list bullet markers (* or + → -)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\s*)[*+]\s/);
    if (match) {
      lines[i] = match[1] + "- " + line.slice(match[0].length);
      if (line !== lines[i]) {
        changes.push({
          type: "format",
          description: `Zeile ${i + 1}: Aufzählung normalisiert (${line.trim()[0]} → -)`,
        });
      }
    }
  }

  // 4. Add blank line before headings if preceded by non-blank text
  const withHeadingBreaks: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const isHeading = /^#{1,3}\s/.test(lines[i]);
    const prevLine = i > 0 ? lines[i - 1] : null;
    const prevIsBlank = prevLine !== null && prevLine.trim() === "";
    const prevIsNotHeading = prevLine !== null && !/^#{1,3}\s/.test(prevLine);

    if (isHeading && prevLine !== null && !prevIsBlank && prevIsNotHeading) {
      withHeadingBreaks.push("");
      changes.push({
        type: "format",
        description: `Leerzeile vor Überschrift (Zeile ${i + 1}) eingefügt`,
      });
    }
    withHeadingBreaks.push(lines[i]);
  }
  lines = withHeadingBreaks;

  // 5. Ensure trailing newline
  let result = lines.join("\n");
  if (!result.endsWith("\n")) {
    result += "\n";
  }

  // Restore code blocks
  result = restoreCodeBlocks(result, blocks);

  // Warning for short input
  const warnings: string[] = [];
  if (input.trim().length < 50) {
    warnings.push(
      "Eingabe ist sehr kurz (< 50 Zeichen). Nur minimale Optimierung angewendet.",
    );
  }

  return {
    original: input,
    optimized: result,
    changes,
    warnings,
  };
}

// =============================================================================
// Mode: balanced — structural optimization
// =============================================================================

function balancedOptimize(input: string): OptimizationDiff {
  // Start with conservative
  const base = conservativeOptimize(input);
  const changes: OptimizationChange[] = [...base.changes];
  const warnings: string[] = [...base.warnings];

  if (input.trim().length === 0) {
    return base;
  }

  const { processed, blocks } = extractCodeBlocks(base.optimized);

  // Split into sections by headings
  const lines = processed.split("\n");

  interface Section {
    heading: string;
    headingLine: number;
    key: string | null; // detected section key
    contentLines: string[];
  }

  const sections: Section[] = [];
  let currentSection: Section | null = null;
  const preHeadingLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);

    if (headingMatch) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: line,
        headingLine: i,
        key: detectSectionFromHeading(line),
        contentLines: [],
      };
    } else if (currentSection) {
      currentSection.contentLines.push(line);
    } else {
      preHeadingLines.push(line);
    }
  }
  if (currentSection) {
    sections.push(currentSection);
  }

  // Standardize heading levels (all to ##)
  const h1Regex = /^#\s/;
  const h3Regex = /^###\s/;
  for (const sec of sections) {
    if (h1Regex.test(sec.heading) || h3Regex.test(sec.heading)) {
      const oldHeading = sec.heading;
      sec.heading = sec.heading.replace(/^#{1,3}\s/, "## ");
      changes.push({
        type: "structure",
        description: `Überschrift normalisiert: "${oldHeading.trim()}" → "${sec.heading.trim()}"`,
      });
    }
  }

  // Detect which canonical sections exist and collect them
  const foundKeys = new Set<string>();
  const keyedSections: Map<string, Section> = new Map();
  const unknownSections: Section[] = [];

  for (const sec of sections) {
    if (sec.key) {
      foundKeys.add(sec.key);
      // If duplicate key, merge content
      if (keyedSections.has(sec.key)) {
        const existing = keyedSections.get(sec.key);
        if (existing) {
          existing.contentLines.push("", ...sec.contentLines);
          changes.push({
            type: "structure",
            description: `Doppelte Sektion "${sec.key}" zusammengeführt`,
          });
        }
      } else {
        keyedSections.set(sec.key, sec);
      }
    } else {
      unknownSections.push(sec);
    }
  }

  // Add missing canonical sections — warn instead of injecting TODO placeholders
  for (const cs of CANONICAL_SECTIONS) {
    if (!foundKeys.has(cs.key)) {
      warnings.push(
        `Fehlende Sektion "${getCanonicalSectionName(cs.key)}" nicht ergänzt — keine automatische TODO-Platzhalter-Injektion. Bitte manuell ergänzen.`,
      );
    }
  }

  // Reorder: canonical sections first, then unknown sections
  const reordered: Section[] = [];
  for (const cs of CANONICAL_SECTIONS) {
    const sec = keyedSections.get(cs.key);
    if (sec) reordered.push(sec);
  }
  reordered.push(...unknownSections);

  // Check if ordering changed
  if (
    JSON.stringify(reordered.map((s) => s.key)) !==
    JSON.stringify(sections.map((s) => s.key))
  ) {
    changes.push({
      type: "reorder",
      description: "Sektionen in kanonische Reihenfolge gebracht",
    });
  }

  // Convert bullet-nonconforming requirement lines in requirements section
  for (const sec of reordered) {
    if (sec.key === "requirements") {
      const newContent: string[] = [];
      for (const line of sec.contentLines) {
        const trimmed = line.trim();
        if (
          trimmed.length > 0 &&
          !trimmed.startsWith("-") &&
          !trimmed.startsWith("*") &&
          !trimmed.startsWith("```") &&
          !trimmed.startsWith("<!--")
        ) {
          // Convert standalone lines to bullet points
          newContent.push(`- ${trimmed}`);
          changes.push({
            type: "structure",
            description: `Anforderung in Aufzählung konvertiert: "${trimmed.substring(0, 40)}..."`,
          });
        } else {
          newContent.push(line);
        }
      }
      sec.contentLines = newContent;
    }
  }

  // Build output
  const outputLines: string[] = [...preHeadingLines];
  for (const sec of reordered) {
    outputLines.push(sec.heading);
    outputLines.push(""); // blank line after heading
    outputLines.push(...sec.contentLines);
    // Ensure ending blank line
    if (outputLines.length > 0 && outputLines[outputLines.length - 1] !== "") {
      outputLines.push("");
    }
  }
  outputLines.push("");

  let result = outputLines.join("\n");
  result = restoreCodeBlocks(result, blocks);

  return {
    original: input,
    optimized: result,
    changes,
    warnings,
  };
}

// =============================================================================
// Mode: aggressive — agent workflow scaffolding
// =============================================================================

function aggressiveOptimize(input: string): OptimizationDiff {
  // Start with balanced
  const base = balancedOptimize(input);
  const changes: OptimizationChange[] = [...base.changes];
  const warnings: string[] = [...base.warnings];

  if (input.trim().length === 0) {
    return base;
  }

  // Skip heavy scaffolding for very short prompts
  if (input.trim().length < 200) {
    warnings.push(
      "Eingabe ist unter 200 Zeichen. Aggressive Optimierung teilweise deaktiviert. " +
        "Nur minimale Workflow-Scaffolds werden hinzugefügt.",
    );
  }

  // Extract code blocks before appending
  const { processed, blocks } = extractCodeBlocks(base.optimized);

  // Detect and replace legacy context-window patterns
  let cleanedResult = processed;
  const LEGACY_CONTEXT_PATTERN =
    /##\s+Kontextfenster-Empfehlung[\s\S]*?(?=\n##\s|$)/i;
  const LEGACY_FRESH_PATTERN =
    /Starte\s+diesen\s+Auftrag\s+in\s+einem\s+frischen\/leeren\s+Kontextfenster/i;
  const hasLegacyContext = LEGACY_CONTEXT_PATTERN.test(processed);
  const hasLegacyFresh = LEGACY_FRESH_PATTERN.test(processed);

  if (hasLegacyContext || hasLegacyFresh) {
    const contextBoundarySection = [
      "## Context Boundary / Reality Refresh",
      "",
      "- Chatverlauf, Memory und frühere Reports gelten als STALE_UNTIL_VALIDATED.",
      "- Source of Truth ist der aktuell validierte Zustand aus Git, Issues, PRs, Releases, Dateien und lokalen Gates.",
      "- Alte Reports dürfen nur als historische Evidence genutzt werden.",
      "- Widersprechen alte Angaben dem aktuellen Repo-Zustand, gilt der aktuelle Repo-/GitHub-/Testzustand.",
      "",
    ].join("\n");

    if (hasLegacyContext) {
      cleanedResult = cleanedResult.replace(LEGACY_CONTEXT_PATTERN, () => {
        changes.push({
          type: "replace_section",
          description:
            'Legacy "Kontextfenster-Empfehlung" durch "Context Boundary / Reality Refresh" ersetzt',
        });
        return contextBoundarySection;
      });
    } else {
      // Only the fresh-window pattern exists — add Context Boundary alongside
      cleanedResult += "\n" + contextBoundarySection;
      changes.push({
        type: "add_section",
        description:
          "## Context Boundary / Reality Refresh (Legacy-Kontextfenster-Empfehlung erkannt)",
      });
    }

    warnings.push(
      "Legacy-Kontextfenster-Empfehlung erkannt — besser durch Context Boundary / Reality Refresh ersetzen.",
    );
  }

  // Build agentic scaffolding sections (no TODO placeholders)
  const scaffoldingSections = [
    {
      heading: "## Agenten-Workflow",
      content: [
        "Der folgende Workflow beschreibt die sequenzielle Verarbeitungskette für diesen Prompt:",
        "",
        "```text",
        "Issue → Spec → Verification Contract → Red Tests → Agent-Code → " +
          "CI/Security Gates → Sandbox Preview → Reviewer-Agent → " +
          "Human Approval → Evidence-Kommentar → Merge",
        "```",
        "",
        "Jeder Schritt erzeugt einen überprüfbaren Artefakt. Kein Schritt überspringen.",
        "",
      ],
    },
    {
      heading: "## Kontext-Engineering-Profil",
      content: [
        "### Cold Context",
        "_(Bitte ausfüllen: Hintergrundwissen, das der Agent voraussetzen muss)_",
        "",
        "### Warm Context",
        "_(Bitte ausfüllen: Spezifische Umgebungsdetails, Tools, Versionen)_",
        "",
        "### Hot Context",
        "_(Bitte ausfüllen: Aktuelle Session-Details, was jetzt gerade passiert)_",
        "",
        "### Excluded Context",
        "_(Bitte ausfüllen: Was der Agent NICHT tun soll, verbotene Aktionen)_",
        "",
        "### Source of Truth",
        "_(Bitte ausfüllen: Wo die endgültige Wahrheit liegt — Issue, Repo, API-Doc)_",
        "",
        "### Confidence",
        "Der Agent muss bei jeder Aussage das Confidence-Level angeben: HIGH / MEDIUM / LOW",
        "",
        "### Evidence",
        "Jeder Schritt muss mit einem nachvollziehbaren Evidence-Artefakt belegt werden.",
        "",
      ],
    },
    {
      heading: "## Verification Contract",
      content: [
        "Vor Abschluss prüfen:",
        "",
        "- [ ] Alle Acceptance Criteria erfüllt",
        "- [ ] Red Tests → Green Tests durchlaufen",
        "- [ ] CI/Security Gates grün",
        "- [ ] Reviewer-Agent hat freigegeben",
        "- [ ] Human Approval liegt vor",
        "- [ ] Evidence-Kommentar im Issue gepostet",
        "- [ ] Kein ungeplanter Scope Creep",
        "",
      ],
    },
    {
      heading: "## Human Approval Gate",
      content: [
        "**WICHTIG:** Kein Merge, Commit oder Deploy ohne explizite Human Approval.",
        "",
        "Vor Human Approval vorlegen:",
        "",
        "1. Diff-Stat",
        "2. Geänderte Dateien",
        "3. Testliste mit Ergebnissen",
        "4. Gates-Status",
        "5. Review-Agent Ergebnis",
        "6. Empfehlung: READY TO COMMIT / CHANGES NEEDED / BLOCKED",
        "",
      ],
    },
  ];

  // Append all scaffolding sections
  let result = cleanedResult;
  for (const section of scaffoldingSections) {
    const sectionBlock = section.heading + "\n\n" + section.content.join("\n");
    result += sectionBlock;
    changes.push({
      type: "add_section",
      description: `Workflow-Sektion ergänzt: ${section.heading}`,
    });
  }

  result = restoreCodeBlocks(result, blocks);

  warnings.push(
    "Hinweis: Aggressive Optimierung fügt umfangreiche Struktur hinzu. " +
      "Kontext-Engineering-Profil-Platzhalter bitte vor Verwendung mit konkreten Projektdetails ausfüllen.",
  );

  return {
    original: input,
    optimized: result,
    changes,
    warnings,
  };
}

function extractHeadingFromChangeDescription(
  description: string,
): string | null {
  const quotedMatch = description.match(/"(##[^"]+)"/);
  if (quotedMatch) return quotedMatch[1].trim();

  const bareMatch = description.match(/(##\s.+)$/);
  return bareMatch ? bareMatch[1].trim() : null;
}

function finalizeOptimizationDiff(diff: OptimizationDiff): OptimizationDiff {
  const originalNormalized = diff.original.replace(/\r\n/g, "\n");
  const optimizedNormalized = diff.optimized.replace(/\r\n/g, "\n");

  const changes = diff.changes.filter((change) => {
    if (change.type !== "add_section") {
      return (
        originalNormalized !== optimizedNormalized || change.type !== "reorder"
      );
    }

    const heading = extractHeadingFromChangeDescription(change.description);
    if (!heading) {
      return optimizedNormalized !== originalNormalized;
    }

    return (
      optimizedNormalized.includes(heading) &&
      !originalNormalized.includes(heading)
    );
  });

  const warnings = [...diff.warnings];
  if (
    originalNormalized === optimizedNormalized &&
    warnings.length === 0 &&
    !warnings.some((warning) =>
      /Keine sichere automatische Änderung vorgenommen/i.test(warning),
    )
  ) {
    warnings.unshift("Keine sichere automatische Änderung vorgenommen.");
  }

  return {
    ...diff,
    changes: originalNormalized === optimizedNormalized ? [] : changes,
    warnings,
  };
}

// =============================================================================
// Quality Validation — blocks placeholder-only optimized outputs
// =============================================================================

/** Patterns that indicate an unresolved placeholder in the optimized output */
const PLACEHOLDER_PATTERNS: RegExp[] = [
  /<!--\s*TODO/i,
  /\bTODO\s*:/i,
  /\bTBD\b/i,
  /requirements?\s+ergänzen/i,
  /verify\s+ergänzen/i,
  /Anforderungen?\s+ergänzen/i,
  /Acceptance\s+Criteria\s+ergänzen/i,
  /Verifikation\s+ergänzen/i,
  /\bplaceholder\b/i,
  /\bPlatzhalter\b/i,
];

/**
 * Check if a markdown string contains any unresolved placeholder pattern.
 * Used as a gate before writing optimized files.
 */
export function containsUnresolvedPlaceholder(markdown: string): boolean {
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(markdown)) return true;
  }
  return false;
}

/**
 * Extract specific unresolved placeholder occurrences from a markdown string.
 * Returns the matched strings for diagnostic purposes.
 */
export function extractPlaceholders(markdown: string): string[] {
  const found: string[] = [];
  for (const pattern of PLACEHOLDER_PATTERNS) {
    pattern.lastIndex = 0;
    const match = markdown.match(pattern);
    if (match) {
      found.push(match[0]);
    }
  }
  return [...new Set(found)]; // deduplicate
}

/**
 * Check if a section's content is effectively empty (only whitespace,
 * comments, or placeholder text). Only flags sections whose headings
 * match known canonical section patterns — arbitrary heading-only
 * sections are not considered "empty" for quality purposes.
 */
function isSectionContentEmpty(
  heading: string,
  contentLines: string[],
): boolean {
  // Only check sections that appear to be canonical/structural sections
  const sectionKey = detectSectionFromHeading(heading);
  if (!sectionKey) return false; // Unknown headings are fine

  const nonEmptyLines = contentLines.filter((line) => {
    const trimmed = line.trim();
    if (trimmed === "") return false;
    if (/^<!--/.test(trimmed)) return false;
    if (PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed))) return false;
    return true;
  });
  return nonEmptyLines.length === 0;
}

/**
 * Validate that an optimized prompt output does not contain unresolved
 * placeholders, empty required sections, or placeholder-only sections.
 *
 * This is the central quality gate for optimized outputs.
 */
export function validateOptimizedPromptQuality(
  original: string,
  optimized: string,
): OptimizationQualityResult {
  const unresolved_placeholders = extractPlaceholders(optimized);
  const empty_sections: string[] = [];
  const warnings: string[] = [];

  // 1. Check for unresolved placeholders
  if (unresolved_placeholders.length > 0) {
    warnings.push(
      `Optimierte Ausgabe enthält ${unresolved_placeholders.length} unresolved Placeholder: ${unresolved_placeholders.join(", ")}`,
    );
  }

  // 2. Check if sections with canonical headings have empty content
  const sectionRegex = /^##\s+(.+)$/gm;
  let match;
  const sections: { heading: string; startIndex: number }[] = [];
  while ((match = sectionRegex.exec(optimized)) !== null) {
    sections.push({ heading: match[1], startIndex: match.index });
  }

  for (let i = 0; i < sections.length; i++) {
    const current = sections[i];
    const nextStart =
      i + 1 < sections.length ? sections[i + 1].startIndex : optimized.length;
    const sectionContent = optimized.slice(
      current.startIndex + current.heading.length + 4, // +4 for "## " + heading
      nextStart,
    );

    const contentLines = sectionContent.split("\n");
    if (isSectionContentEmpty(`## ${current.heading}`, contentLines)) {
      empty_sections.push(current.heading);
    }
  }

  if (empty_sections.length > 0) {
    warnings.push(
      `Optimierte Ausgabe enthält ${empty_sections.length} leere Sektionen: ${empty_sections.join(", ")}`,
    );
  }

  // 3. Confirm structural improvement: optimized should not just be
  //    headings without substance compared to the original
  const originalLength = original.replace(/\s/g, "").length;
  const optimizedLength = optimized.replace(/\s/g, "").length;
  const structural_improvement_confirmed =
    optimizedLength >= originalLength &&
    unresolved_placeholders.length === 0 &&
    empty_sections.length === 0;

  const passed =
    unresolved_placeholders.length === 0 && empty_sections.length === 0;

  return {
    passed,
    unresolved_placeholders,
    empty_sections,
    warnings,
    structural_improvement_confirmed,
  };
}

// =============================================================================
// Public API
// =============================================================================

export function optimizePrompt(
  input: string,
  mode: OptimizationMode,
): OptimizationDiff {
  let diff: OptimizationDiff;

  switch (mode) {
    case "conservative":
      diff = conservativeOptimize(input);
      break;
    case "balanced":
      diff = balancedOptimize(input);
      break;
    case "aggressive":
      diff = aggressiveOptimize(input);
      break;
    default:
      // Exhaustive: TypeScript enforces all OptimizationMode cases handled above
      throw new Error(`Unbekannter Optimierungsmodus: ${String(mode)}`);
  }

  return finalizeOptimizationDiff(diff);
}
