import type {
  OptimizationDiff,
  OptimizationChange,
  OptimizationMode,
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

  // Add missing canonical sections with TODO placeholders
  for (const cs of CANONICAL_SECTIONS) {
    if (!foundKeys.has(cs.key)) {
      const heading = getCanonicalSectionName(cs.key);
      const placeholderSec: Section = {
        heading,
        headingLine: -1,
        key: cs.key,
        contentLines: [`<!-- TODO: ${cs.key} ergänzen -->`, ""],
      };
      keyedSections.set(cs.key, placeholderSec);
      changes.push({
        type: "add_section",
        description: `Fehlende Sektion ergänzt: ${heading}`,
      });
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

  // Build agentic scaffolding sections
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
        "<!-- TODO: Hintergrundwissen beschreiben, das der Agent voraussetzen muss -->",
        "",
        "### Warm Context",
        "<!-- TODO: Spezifische Umgebungsdetails, Tools, Versionen -->",
        "",
        "### Hot Context",
        "<!-- TODO: Aktuelle Session-Details, was jetzt gerade passiert -->",
        "",
        "### Excluded Context",
        "<!-- TODO: Was der Agent NICHT tun soll, verbotene Aktionen -->",
        "",
        "### Source of Truth",
        "<!-- TODO: Wo die endgültige Wahrheit liegt (Issue, Repo, API-Doc) -->",
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
  let result = processed;
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
      'Alle "<!-- TODO -->" Marker vor Verwendung überprüfen und anpassen.',
  );

  return {
    original: input,
    optimized: result,
    changes,
    warnings,
  };
}

// =============================================================================
// Public API
// =============================================================================

export function optimizePrompt(
  input: string,
  mode: OptimizationMode,
): OptimizationDiff {
  switch (mode) {
    case "conservative":
      return conservativeOptimize(input);
    case "balanced":
      return balancedOptimize(input);
    case "aggressive":
      return aggressiveOptimize(input);
    default: {
      // Exhaustive check: all OptimizationMode values are handled above
      void (mode as never);
      throw new Error(`Unbekannter Optimierungsmodus: ${String(mode)}`);
    }
  }
}
