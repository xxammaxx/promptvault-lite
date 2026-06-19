// =============================================================================
// PromptVault Lite — Blueprint Optimization Engine
// =============================================================================
// Deterministic, local, no-network. Mirrors promptOptimizer.ts with
// blueprint-specific canonical sections and optimization logic.
// =============================================================================

import type {
  BlueprintOptimizationMode,
  BlueprintOptimizationDiff,
  BlueprintOptimizationQualityResult,
  OptimizationChange,
} from "@/types";

// =============================================================================
// Canonical Blueprint Sections
// =============================================================================

const CANONICAL_BLUEPRINT_SECTIONS = [
  { key: "goal", patterns: [/Ziel|Goal|Objective|Purpose|Zweck|Vision/i] },
  {
    key: "scope",
    patterns: [/Scope|Umfang|In Scope|Out of Scope|Boundar|Grenz/i],
  },
  {
    key: "architecture",
    patterns: [
      /Architektur|Architecture|Component|Komponente|System Design|Data Flow|Datenfluss/i,
    ],
  },
  {
    key: "implementation",
    patterns: [
      /Implementierung|Implementation|Phases|Phasen|Roadmap|Plan|Sprint|Milestone|MVP/i,
    ],
  },
  {
    key: "risks",
    patterns: [
      /Risks?|Risiken|Limitations?|Einschränkungen|Assumptions|Annahmen|Threats/i,
    ],
  },
  {
    key: "security",
    patterns: [
      /Security|Sicherheit|Privacy|Datenschutz|Auth|Compliance|GDPR|DSGVO/i,
    ],
  },
  {
    key: "testing",
    patterns: [/Tests?|Testing|Testen|QA|Quality|Red Tests|Verification/i],
  },
  {
    key: "evidence",
    patterns: [
      /Evidence|Nachweise?|Belege?|Proof|Verification Contract|Akzeptanz/i,
    ],
  },
  {
    key: "next_steps",
    patterns: [
      /Next Steps?|Nächste Schritte|Handoff|Übergabe|Follow.?up|Action Items/i,
    ],
  },
];

function detectBlueprintSectionFromHeading(heading: string): string | null {
  const cleaned = heading
    .replace(/^#{1,3}\s*/, "")
    .trim()
    .toLowerCase();
  for (const sec of CANONICAL_BLUEPRINT_SECTIONS) {
    for (const pat of sec.patterns) {
      pat.lastIndex = 0;
      if (pat.test(cleaned)) return sec.key;
    }
  }
  return null;
}

function getCanonicalBlueprintSectionName(key: string): string {
  const names: Record<string, string> = {
    goal: "## Ziel / Goal",
    scope: "## Scope / Umfang",
    architecture: "## Architecture / Architektur",
    implementation: "## Implementation Plan / Umsetzungsplan",
    risks: "## Risks & Known Limitations / Risiken & bekannte Einschränkungen",
    security: "## Security & Privacy / Sicherheit & Datenschutz",
    testing: "## Testing & Verification / Tests & Verifikation",
    evidence:
      "## Evidence & Verification Contract / Nachweise & Verifikationsvertrag",
    next_steps: "## Next Steps / Nächste Schritte",
  };
  return names[key] || `## ${key}`;
}

// =============================================================================
// Fenced code block handling
// =============================================================================

function extractCodeBlocks(text: string): {
  processed: string;
  blocks: string[];
} {
  const blocks: string[] = [];
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
// Contamination Cleanup
// =============================================================================

const FOREIGN_APP_NAMES = ["Positron", "MietVisor", "CiviPet", "Prompt_Archiv"];

const STALE_RUN_PATTERNS = [
  /run\s*report\s*(?:from|vom|dated?)\s*202[0-5]/i,
  /test run\s*(?:from|vom|dated?)\s*202[0-5]/i,
  /test\s*results?\s*(?:from|vom|dated?)\s*202[0-5]/i,
];

/**
 * Strip contamination markers from blueprint content.
 * Only removes clearly identifiable contamination — does not modify content structure.
 */
function cleanContamination(content: string): {
  cleaned: string;
  cleanedItems: string[];
} {
  const cleanedItems: string[] = [];
  let result = content;

  // Mark foreign app names (don't remove, just mark)
  for (const name of FOREIGN_APP_NAMES) {
    const regex = new RegExp(`\\b${name}\\b`, "gi");
    if (regex.test(result)) {
      result = result.replace(regex, `~~CONTAMINATED:${name}~~`);
      cleanedItems.push(`Foreign app name "${name}" marked as contaminated`);
    }
    regex.lastIndex = 0;
  }

  // Mark stale run reports
  for (const pattern of STALE_RUN_PATTERNS) {
    if (pattern.test(result)) {
      result = result.replace(
        pattern,
        (match) => `~~STALE_RUN_REPORT:${match}~~`,
      );
      cleanedItems.push(`Stale run report marked`);
    }
    pattern.lastIndex = 0;
  }

  return { cleaned: result, cleanedItems };
}

// =============================================================================
// Mode: conservative — light cleanup
// =============================================================================

function conservativeOptimize(input: string): BlueprintOptimizationDiff {
  const changes: OptimizationChange[] = [];

  if (input.trim().length === 0) {
    return {
      original: input,
      optimized: "",
      changes: [],
      warnings: ["Blueprint input is empty — no optimization possible."],
      contamination_cleaned: false,
    };
  }

  const { processed, blocks } = extractCodeBlocks(input);

  let lines = processed.split("\n");

  // 1. Trim trailing whitespace
  const trimmedLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].replace(/[ \t]+$/, "");
    if (trimmed !== lines[i]) {
      changes.push({
        type: "whitespace",
        description: `Line ${i + 1}: trailing whitespace removed`,
      });
    }
    trimmedLines.push(trimmed);
  }
  lines = trimmedLines;

  // 2. Collapse multiple blank lines
  const collapsedLines: string[] = [];
  let lastWasBlank = false;
  for (const line of lines) {
    const isBlank = line.trim() === "";
    if (isBlank && lastWasBlank) continue;
    collapsedLines.push(line);
    lastWasBlank = isBlank;
  }
  if (collapsedLines.length < lines.length) {
    changes.push({
      type: "whitespace",
      description: "Multiple blank lines collapsed to one",
    });
  }
  lines = collapsedLines;

  // 3. Normalize list bullets
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\s*)[*+]\s/);
    if (match) {
      lines[i] = match[1] + "- " + line.slice(match[0].length);
      if (line !== lines[i]) {
        changes.push({
          type: "format",
          description: `Line ${i + 1}: list bullet normalized (${line.trim()[0]} → -)`,
        });
      }
    }
  }

  // 4. Add blank line before headings
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
        description: `Blank line inserted before heading (line ${i + 1})`,
      });
    }
    withHeadingBreaks.push(lines[i]);
  }
  lines = withHeadingBreaks;

  // 5. Contamination cleanup
  const preCleanup = lines.join("\n");
  const { cleaned, cleanedItems } = cleanContamination(preCleanup);
  for (const item of cleanedItems) {
    changes.push({
      type: "content",
      description: item,
    });
  }

  // 6. Ensure trailing newline
  let result = cleaned;
  if (!result.endsWith("\n")) {
    result += "\n";
  }

  result = restoreCodeBlocks(result, blocks);

  const warnings: string[] = [];
  if (input.trim().length < 100) {
    warnings.push(
      "Blueprint input is very short (< 100 chars). Only minimal optimization applied.",
    );
  }

  return {
    original: input,
    optimized: result,
    changes,
    warnings,
    contamination_cleaned: cleanedItems.length > 0,
  };
}

// =============================================================================
// Mode: balanced — structural optimization
// =============================================================================

function balancedOptimize(input: string): BlueprintOptimizationDiff {
  const base = conservativeOptimize(input);
  const changes: OptimizationChange[] = [...base.changes];
  const warnings: string[] = [...base.warnings];

  if (input.trim().length === 0) return base;

  const { processed, blocks } = extractCodeBlocks(base.optimized);

  const lines = processed.split("\n");

  interface Section {
    heading: string;
    headingLine: number;
    key: string | null;
    contentLines: string[];
  }

  const sections: Section[] = [];
  let currentSection: Section | null = null;
  const preHeadingLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);

    if (headingMatch) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        heading: line,
        headingLine: i,
        key: detectBlueprintSectionFromHeading(line),
        contentLines: [],
      };
    } else if (currentSection) {
      currentSection.contentLines.push(line);
    } else {
      preHeadingLines.push(line);
    }
  }
  if (currentSection) sections.push(currentSection);

  // Standardize heading levels to ##
  const h1Regex = /^#\s/;
  const h3Regex = /^###\s/;
  for (const sec of sections) {
    if (h1Regex.test(sec.heading) || h3Regex.test(sec.heading)) {
      const oldHeading = sec.heading;
      sec.heading = sec.heading.replace(/^#{1,3}\s/, "## ");
      changes.push({
        type: "structure",
        description: `Heading normalized: "${oldHeading.trim()}" → "${sec.heading.trim()}"`,
      });
    }
  }

  // Merge duplicate sections
  const foundKeys = new Set<string>();
  const keyedSections: Map<string, Section> = new Map();
  const unknownSections: Section[] = [];

  for (const sec of sections) {
    if (sec.key) {
      foundKeys.add(sec.key);
      if (keyedSections.has(sec.key)) {
        const existing = keyedSections.get(sec.key);
        if (existing) {
          existing.contentLines.push("", ...sec.contentLines);
          changes.push({
            type: "structure",
            description: `Duplicate section "${sec.key}" merged`,
          });
        }
      } else {
        keyedSections.set(sec.key, sec);
      }
    } else {
      unknownSections.push(sec);
    }
  }

  // Warn about missing canonical sections
  for (const cs of CANONICAL_BLUEPRINT_SECTIONS) {
    if (!foundKeys.has(cs.key)) {
      warnings.push(
        `Missing section "${getCanonicalBlueprintSectionName(cs.key)}" not auto-injected. Please add manually.`,
      );
    }
  }

  // Reorder: canonical sections first, then unknown
  const reordered: Section[] = [];
  for (const cs of CANONICAL_BLUEPRINT_SECTIONS) {
    const sec = keyedSections.get(cs.key);
    if (sec) reordered.push(sec);
  }
  reordered.push(...unknownSections);

  if (
    JSON.stringify(reordered.map((s) => s.key)) !==
    JSON.stringify(sections.map((s) => s.key))
  ) {
    changes.push({
      type: "reorder",
      description: "Sections reordered to canonical blueprint sequence",
    });
  }

  // Convert non-list lines in requirements/implementation sections to bullets
  for (const sec of reordered) {
    if (sec.key === "implementation" || sec.key === "scope") {
      const newContent: string[] = [];
      for (const line of sec.contentLines) {
        const trimmed = line.trim();
        if (
          trimmed.length > 0 &&
          !trimmed.startsWith("-") &&
          !trimmed.startsWith("*") &&
          !trimmed.startsWith("```") &&
          !trimmed.startsWith("<!--") &&
          !trimmed.startsWith("~~")
        ) {
          newContent.push(`- ${trimmed}`);
          changes.push({
            type: "structure",
            description: `Line converted to bullet: "${trimmed.substring(0, 50)}..."`,
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
    outputLines.push("");
    outputLines.push(...sec.contentLines);
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
    contamination_cleaned:
      base.contamination_cleaned || changes.some((c) => c.type === "content"),
  };
}

// =============================================================================
// Mode: aggressive — full blueprint scaffolding
// =============================================================================

function aggressiveOptimize(input: string): BlueprintOptimizationDiff {
  const base = balancedOptimize(input);
  const changes: OptimizationChange[] = [...base.changes];
  const warnings: string[] = [...base.warnings];

  if (input.trim().length === 0) return base;

  if (input.trim().length < 200) {
    warnings.push(
      "Blueprint input under 200 chars. Aggressive optimization partially disabled. Only minimal scaffolding added.",
    );
  }

  const { processed, blocks } = extractCodeBlocks(base.optimized);

  // Add blueprint-specific scaffolding sections
  const scaffoldingSections = [
    {
      heading: "## Verification Contract",
      content: [
        "Before considering this blueprint complete, verify:",
        "",
        "- [ ] All acceptance criteria are defined and measurable",
        "- [ ] Architecture covers all components and data flows",
        "- [ ] Scope boundaries (in/out of scope, MVP cut) are clear",
        "- [ ] Risks are identified with mitigation plans",
        "- [ ] Security and privacy considerations are addressed",
        "- [ ] Test strategy is defined with red test expectations",
        "- [ ] Evidence requirements are specified (what proves completion?)",
        "- [ ] Human approval gates are defined where needed",
        "",
      ],
    },
    {
      heading: "## Human Approval Gate",
      content: [
        "**IMPORTANT:** No merge, commit, or deploy without explicit Human Approval.",
        "",
        "Before requesting Human Approval, ensure:",
        "",
        "1. All acceptance criteria are met",
        "2. All tests pass (red → green)",
        "3. CI/Security gates are green",
        "4. Reviewer-Agent has approved (if applicable)",
        "5. Evidence artifacts are collected and posted",
        "6. No unplanned scope creep has occurred",
        "",
      ],
    },
    {
      heading: "## Evidence & Portfolio",
      content: [
        "Evidence artifacts to collect during implementation:",
        "",
        "- Test results (pass/fail counts, test output)",
        "- CI pipeline status (green/red/failed)",
        "- Diff stats (files changed, lines added/removed)",
        "- Screenshots (UI changes, visual regressions)",
        "- Review findings (reviewer-agent report)",
        "- Approval records (human approval timestamp)",
        "",
      ],
    },
    {
      heading:
        "## Was kann die Software jetzt im Vergleich zum vorherigen Lauf?",
      content: [
        "### Neue Fähigkeiten",
        "_(To be filled after implementation: what new capabilities were added?)_",
        "",
        "### Entfernte Blocker",
        "_(What blockers were resolved?)_",
        "",
        "### Veraltete Annahmen, die entfernt oder markiert wurden",
        "_(What stale assumptions were corrected?)_",
        "",
        "### Unveränderte Einschränkungen",
        "_(What limitations remain unchanged?)_",
        "",
        "### Verbleibende Risiken",
        "_(What risks remain after this implementation?)_",
        "",
        "### Nächster sinnvoller Schritt",
        "_(What should happen next?)_",
        "",
      ],
    },
  ];

  let result = processed;
  for (const section of scaffoldingSections) {
    const sectionBlock = section.heading + "\n\n" + section.content.join("\n");
    result += sectionBlock;
    changes.push({
      type: "add_section",
      description: `Blueprint scaffolding section added: ${section.heading}`,
    });
  }

  result = restoreCodeBlocks(result, blocks);

  warnings.push(
    "Note: Aggressive optimization adds extensive scaffolding. " +
      'Fill in the "Was kann die Software jetzt..." section with actual implementation results.',
  );

  return {
    original: input,
    optimized: result,
    changes,
    warnings,
    contamination_cleaned: base.contamination_cleaned,
  };
}

// =============================================================================
// Placeholder patterns for quality validation
// =============================================================================

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /<!--\s*TODO/i,
  /\bTODO\s*:/i,
  /\bTBD\b/i,
  /requirements?\s+ergänzen/i,
  /verify\s+ergänzen/i,
  /Anforderungen?\s+ergänzen/i,
  /\bplaceholder\b/i,
  /\bPlatzhalter\b/i,
];

/**
 * Check if a markdown string contains any unresolved placeholder pattern.
 */
export function blueprintContainsUnresolvedPlaceholder(
  markdown: string,
): boolean {
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(markdown)) return true;
  }
  return false;
}

function extractPlaceholders(markdown: string): string[] {
  const found: string[] = [];
  for (const pattern of PLACEHOLDER_PATTERNS) {
    pattern.lastIndex = 0;
    const match = markdown.match(pattern);
    if (match) found.push(match[0]);
  }
  return [...new Set(found)];
}

function isSectionContentEmpty(
  heading: string,
  contentLines: string[],
): boolean {
  const sectionKey = detectBlueprintSectionFromHeading(heading);
  if (!sectionKey) return false; // Unknown headings are fine

  const nonEmptyLines = contentLines.filter((line) => {
    const trimmed = line.trim();
    if (trimmed === "") return false;
    if (/^<!--/.test(trimmed)) return false;
    if (PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed))) return false;
    if (trimmed.startsWith("~~")) return false; // contamination markers
    return true;
  });
  return nonEmptyLines.length === 0;
}

/**
 * Validate that an optimized blueprint output does not contain unresolved
 * placeholders, empty required sections, or unreviewed contamination.
 */
export function validateBlueprintQuality(
  original: string,
  optimized: string,
): BlueprintOptimizationQualityResult {
  const unresolvedPlaceholders = extractPlaceholders(optimized);
  const emptySections: string[] = [];
  const warnings: string[] = [];

  // 1. Check unresolved placeholders
  if (unresolvedPlaceholders.length > 0) {
    warnings.push(
      `Optimized output contains ${unresolvedPlaceholders.length} unresolved placeholder(s): ${unresolvedPlaceholders.join(", ")}`,
    );
  }

  // 2. Check empty sections
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
      current.startIndex + current.heading.length + 4,
      nextStart,
    );
    const contentLines = sectionContent.split("\n");
    if (isSectionContentEmpty(`## ${current.heading}`, contentLines)) {
      emptySections.push(current.heading);
    }
  }

  if (emptySections.length > 0) {
    warnings.push(
      `Optimized output contains ${emptySections.length} empty section(s): ${emptySections.join(", ")}`,
    );
  }

  // 3. Check for contamination markers in optimized output
  const hasContaminationMarkers = /~~CONTAMINATED:|~~STALE_RUN_REPORT:/i.test(
    optimized,
  );
  const contaminationResolved = !hasContaminationMarkers;

  if (hasContaminationMarkers) {
    warnings.push(
      "Optimized output still contains contamination markers. Manual review required.",
    );
  }

  // 4. Structural improvement check
  const originalLength = original.replace(/\s/g, "").length;
  const optimizedLength = optimized.replace(/\s/g, "").length;
  const structuralImprovementConfirmed =
    optimizedLength >= originalLength &&
    unresolvedPlaceholders.length === 0 &&
    emptySections.length === 0 &&
    contaminationResolved;

  const passed =
    unresolvedPlaceholders.length === 0 &&
    emptySections.length === 0 &&
    contaminationResolved;

  return {
    passed,
    unresolved_placeholders: unresolvedPlaceholders,
    empty_sections: emptySections,
    warnings,
    structural_improvement_confirmed: structuralImprovementConfirmed,
    contamination_resolved: contaminationResolved,
  };
}

// =============================================================================
// Public API
// =============================================================================

export function optimizeBlueprint(
  input: string,
  mode: BlueprintOptimizationMode,
): BlueprintOptimizationDiff {
  switch (mode) {
    case "conservative":
      return conservativeOptimize(input);
    case "balanced":
      return balancedOptimize(input);
    case "aggressive":
      return aggressiveOptimize(input);
    default: {
      const _exhaustive: never = mode;
      throw new Error(
        `Unknown blueprint optimization mode: ${String(_exhaustive)}`,
      );
    }
  }
}
